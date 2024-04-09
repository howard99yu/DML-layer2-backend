class ExistedException extends Error {
    constructor(message) {
        super(message);
        this.error = message;
    }
}

export default ExistedException;
