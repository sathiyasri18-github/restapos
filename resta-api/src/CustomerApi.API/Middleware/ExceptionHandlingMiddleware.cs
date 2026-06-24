using FluentValidation;
using System.Net;
using System.Text.Json;

namespace CustomerApi.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ValidationException ex)
        {
            logger.LogWarning("Validation error: {Errors}", ex.Errors);

            context.Response.StatusCode  = (int)HttpStatusCode.BadRequest;
            context.Response.ContentType = "application/json";

            var errors = ex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray());

            var response = new { title = "Validation Failed", status = 400, errors };
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
        catch (UnauthorizedAccessException ex)
        {
            logger.LogWarning("Unauthorized: {Message}", ex.Message);

            context.Response.StatusCode  = (int)HttpStatusCode.Unauthorized;
            context.Response.ContentType = "application/json";

            var response = new { title = ex.Message, status = 401 };
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");

            context.Response.StatusCode  = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            var response = new { title = "An unexpected error occurred.",exception = ex.Message, stackTrace = ex.StackTrace, innerException = ex.InnerException?.Message, status = 500 };
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}
