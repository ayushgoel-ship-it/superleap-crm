package com.cars24.crmcore.exception;

public class OptimisticConflictException extends RuntimeException {

    public OptimisticConflictException() {
        super();
    }

    public OptimisticConflictException(String message) {
        super(message);
    }

    public OptimisticConflictException(String message, Throwable cause) {
        super(message, cause);
    }

    public OptimisticConflictException(Throwable cause) {
        super(cause);
    }
}
