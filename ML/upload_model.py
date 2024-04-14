from google.cloud import storage
#pip install --upgrade google-cloud-storage. 
def upload_to_bucket(blob_name, path_to_file, bucket_name):
    """ Upload data to a bucket"""
    print("uploda")
    # Explicitly use service account credentials by specifying the private key
    # file.
    storage_client = storage.Client.from_service_account_json(
        "./ML/intrepid-stock-411303-15174ccc4746.json")

    #print(buckets = list(storage_client.list_buckets())

    bucket = storage_client.get_bucket(bucket_name)
    blob = bucket.blob(blob_name)
    blob.upload_from_filename(path_to_file)
    print("done")
    #returns a public url
    # return blob.public_url
    