package com.cars24.crmcore.exception;

public class IllegalStateTransitionException extends RuntimeException {

    public IllegalStateTransitionException() {
        super();
    }

    public IllegalStateTransitionException(String message) {
        super(message);
    }

    public IllegalStateTransitionException(String message, Throwable cause) {
        super(message, cause);
    }

    public IllegalStateTransitionException(Throwable cause) {
        super(cause);
    }
}
