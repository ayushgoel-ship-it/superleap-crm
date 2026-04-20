package com.cars24.crmcore.exception;

public class ExternalDependencyException extends RuntimeException {

    public ExternalDependencyException() {
        super();
    }

    public ExternalDependencyException(String message) {
        super(message);
    }

    public ExternalDependencyException(String message, Throwable cause) {
        super(message, cause);
    }

    public ExternalDependencyException(Throwable cause) {
        super(cause);
    }
}
