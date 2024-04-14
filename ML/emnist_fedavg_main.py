# Copyright 2020, The TensorFlow Federated Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Simple FedAvg to train EMNIST.

This is intended to be a minimal stand-alone experiment script demonstrating
usage of TFF's Federated Compute API for a from-scratch Federated Avearging
implementation.
"""

import collections
import functools
import json
import pickle


from collections import OrderedDict

from absl import app
from absl import flags
import numpy as np
import tensorflow as tf
import tensorflow_federated as tff

import simple_fedavg_tff
import upload_model

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        return super(NumpyEncoder, self).default(obj)

# Training hyperparameters
flags.DEFINE_integer('total_rounds', 1, 'Number of total training rounds.') # arg1
flags.DEFINE_integer('rounds_per_eval', 1, 'How often to evaluate')
flags.DEFINE_integer(
    'train_clients_per_round', 4, 'How many clients to sample per round.'
)
flags.DEFINE_integer(
    'client_epochs_per_round',
    3,
    'Number of epochs in the client to take per round.',
)
flags.DEFINE_integer('batch_size', 16, 'Batch size used on the client.')
flags.DEFINE_integer('test_batch_size', 128, 'Minibatch size of test data.')

# Optimizer configuration (this defines one or more flags per optimizer).
flags.DEFINE_float('server_learning_rate', 1.0, 'Server learning rate.')
flags.DEFINE_float('client_learning_rate', 0.1, 'Client learning rate.')

FLAGS = flags.FLAGS


def evaluate(keras_model, test_dataset):
  """Evaluate the acurracy of a keras model on a test dataset."""
  metric = tf.keras.metrics.SparseCategoricalAccuracy(name='test_accuracy')
  for batch in test_dataset:
    predictions = keras_model(batch['x'])
    metric.update_state(y_true=batch['y'], y_pred=predictions)
  return metric.result()




def get_emnist_dataset():
  """Loads and preprocesses the EMNIST dataset.

  Returns:
    A `(emnist_train, emnist_test)` tuple where `emnist_train` is a
    `tff.simulation.datasets.ClientData` object representing the training data
    and `emnist_test` is a single `tf.data.Dataset` representing the test data
    of all clients.
  """
  emnist_train, emnist_test = tff.simulation.datasets.emnist.load_data(
      only_digits=True
  )

  def element_fn(element):
    return collections.OrderedDict(
        x=tf.expand_dims(element['pixels'], -1), y=element['label']
    )

  def preprocess_train_dataset(dataset):
    # Use buffer_size same as the maximum client dataset size,
    # 418 for Federated EMNIST
    return (
        dataset.map(element_fn)
        .shuffle(buffer_size=418)
        .repeat(count=FLAGS.client_epochs_per_round)
        .batch(FLAGS.batch_size, drop_remainder=False)
    )

  def preprocess_test_dataset(dataset):
    return dataset.map(element_fn).batch(
        FLAGS.test_batch_size, drop_remainder=False
    )

  emnist_train = emnist_train.preprocess(preprocess_train_dataset)
  emnist_test = preprocess_test_dataset(
      emnist_test.create_tf_dataset_from_all_clients()
  )
  return emnist_train, emnist_test


def create_original_fedavg_cnn_model(only_digits=True):
  """The CNN model used in https://arxiv.org/abs/1602.05629.

  Args:
    only_digits: If True, uses a final layer with 10 outputs, for use with the
      digits only EMNIST dataset. If False, uses 62 outputs for the larger
      dataset.

  Returns:
    An uncompiled `tf.keras.Model`.
  """
  data_format = 'channels_last'
  input_shape = [28, 28, 1]
  max_pool = functools.partial(
      tf.keras.layers.MaxPooling2D,
      pool_size=(2, 2),
      padding='same',
      data_format=data_format,
  )
  conv2d = functools.partial(
      tf.keras.layers.Conv2D,
      kernel_size=5,
      padding='same',
      data_format=data_format,
      activation=tf.nn.relu,
  )
  model = tf.keras.models.Sequential([
      conv2d(filters=32, input_shape=input_shape),
      max_pool(),
      conv2d(filters=64),
      max_pool(),
      tf.keras.layers.Flatten(),
      tf.keras.layers.Dense(512, activation=tf.nn.relu),
      tf.keras.layers.Dense(10 if only_digits else 62),
  ])
  return model


def server_optimizer_fn():
  return tf.keras.optimizers.SGD(learning_rate=FLAGS.server_learning_rate)


def client_optimizer_fn():
  return tf.keras.optimizers.SGD(learning_rate=FLAGS.client_learning_rate)


def main(argv):
  if len(argv) > 1:
    raise app.UsageError('Too many command-line arguments.')
  tff.backends.native.set_sync_local_cpp_execution_context()

  # try:
  #   download_blob()
  #   print("Downloaded MNIST from bucket")
  # except:
  #   print("Exception!")

  # return 0
  
  train_data, test_data = get_emnist_dataset()

  def tff_model_fn():
    """Constructs a fully initialized model for use in federated averaging."""
    keras_model = create_original_fedavg_cnn_model(only_digits=True)
    loss = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)
    metrics = [tf.keras.metrics.SparseCategoricalAccuracy()]
    return tff.learning.models.from_keras_model(
        keras_model,
        loss=loss,
        metrics=metrics,
        input_spec=train_data.element_type_structure,
    )

  iterative_process = simple_fedavg_tff.build_federated_averaging_process(
      tff_model_fn, server_optimizer_fn, client_optimizer_fn
  )
  server_state = iterative_process.initialize()
  # Keras model that represents the global model we'll evaluate test data on.
  keras_model = create_original_fedavg_cnn_model(only_digits=True)
  test = []
  for round_num in range(FLAGS.total_rounds):
    sampled_clients = np.random.choice(
        train_data.client_ids, size=FLAGS.train_clients_per_round, replace=False
    )
    sampled_train_data = [
        train_data.create_tf_dataset_for_client(client)
        for client in sampled_clients
    ]
    server_state, train_metrics, cw, mo = iterative_process.next(
        server_state, sampled_train_data
    )
    print("=====================================================")
    print(f'Round {round_num}')
    print(f'\tTraining metrics: {train_metrics}')
    if round_num % FLAGS.rounds_per_eval == 0:
      server_state.model.assign_weights_to(keras_model)
      accuracy = evaluate(keras_model, test_data)
      print(f'\tValidation accuracy: {accuracy * 100.0:.2f}%')
  
  print("=====================================================")
  print('Final evaluation')
  server_state.model.assign_weights_to(keras_model)
  accuracy = evaluate(keras_model, test_data)
  print(f'\tValidation accuracy: {accuracy * 100.0:.2f}%')
  print("Model summary: \n")
  print(keras_model.summary())
  print("=====================================================")


  case1 = {
    "status" : "fail",
    "data" : {
      "nodeA": "fail",
      "nodeB": "success",
      "nodeC": "success",
      "nodeD": "success",
    }
  }
  
  case2 = {
    "status" : "fail",
    "data" : {
      "nodeA": "fail",
      "nodeB": "fail",
      "nodeC": "success",
      "nodeD": "success",
    }
  }
  case3 = {
    "status" : "success",
    "data" : {
      "nodeA": "sucess",
      "nodeB": "success",
      "nodeC": "success",
      "nodeD": "success",
    }
  }
  
  case_array = [case1, case2, case3]
  rand =2 #np.random.randint(0, 3)
  print(case_array[rand]["status"])
  
  if (case_array[rand]["status"] == "fail"):
    with open("./ML/report.txt", "w") as f:
      f.write(str(case_array[rand]))
  else:
    with open("./ML/report.txt", "w") as f:
      f.write(str(case_array[rand]))
  # saves model and weights to disk
    model_json = keras_model.to_json()
    with open("./ML/model.json", "w") as json_file:
      json_file.write(model_json)
    keras_model.save_weights("./ML/model.h5")
    # Open the file in read mode
    with open("./ML/mo.txt", "w") as file:
        # Convert the Python object to JSON format
        json_string = json.dumps(mo, cls=NumpyEncoder)
        # Print the JSON data
        file.write(json_string)
    print("Model optimizer saved to disk")
    with open("./ML/cw.txt", "w") as f:
      f.write(str(cw))
    # upload_model.upload_to_bucket("model.json", "./ML/model.json", "file-bucket93")
    # upload_model.upload_to_bucket("model.h5", "./ML/model.h5", "file-bucket93")
    return 0

  # # load json and create model
  # json_file = open('model.json', 'r')
  # loaded_model_json = json_file.read()
  # json_file.close()
  # loaded_model = tf.keras.models.model_from_json(loaded_model_json)
  # # load weights into new model
  # loaded_model.load_weights("model.h5")
  # print("Loaded model from disk")
  # accuracy = evaluate(keras_model, test_data)
  # print(f'\tValidation accuracy: {accuracy * 100.0:.2f}%')

  





if __name__ == '__main__':
  app.run(main)