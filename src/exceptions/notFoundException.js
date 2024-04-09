class NotFoundException extends Error {
    constructor(message) {
        super(message);
        this.error = message;
    }
}

export default NotFoundException;