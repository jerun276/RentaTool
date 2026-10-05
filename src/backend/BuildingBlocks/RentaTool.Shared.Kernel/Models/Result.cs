namespace RentaTool.Shared.Kernel.Models;

public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? ErrorMessage { get; }
    public int StatusCode { get; }

    protected Result(bool isSuccess, T? value, string? errorMessage, int statusCode)
    {
        IsSuccess = isSuccess;
        Value = value;
        ErrorMessage = errorMessage;
        StatusCode = statusCode;
    }

    public static Result<T> Success(T value, int statusCode = 200) => new(true, value, null, statusCode);
    public static Result<T> Failure(string errorMessage, int statusCode = 400) => new(false, default, errorMessage, statusCode);
}

public class Result
{
    public bool IsSuccess { get; }
    public string? ErrorMessage { get; }
    public int StatusCode { get; }

    protected Result(bool isSuccess, string? errorMessage, int statusCode)
    {
        IsSuccess = isSuccess;
        ErrorMessage = errorMessage;
        StatusCode = statusCode;
    }

    public static Result Success(int statusCode = 200) => new(true, null, statusCode);
    public static Result Failure(string errorMessage, int statusCode = 400) => new(false, errorMessage, statusCode);
}
