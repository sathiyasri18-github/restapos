using Asp.Versioning.ApiExplorer;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace CustomerApi.API.Extensions;

public class ConfigureSwaggerOptions(IApiVersionDescriptionProvider provider)
    : IConfigureOptions<SwaggerGenOptions>
{
    public void Configure(SwaggerGenOptions options)
    {
        foreach (var description in provider.ApiVersionDescriptions)
        {
            options.SwaggerDoc(description.GroupName, new OpenApiInfo
            {
                Title       = $"Customer API {description.ApiVersion}",
                Version     = description.ApiVersion.ToString(),
                Description = description.IsDeprecated
                    ? "This API version has been deprecated."
                    : "A clean-architecture .NET 8 Web API with CQRS, MediatR, EF Core, and FluentValidation.",
                Contact = new OpenApiContact
                {
                    Name  = "Customer API Team",
                    Email = "api@customerapi.com"
                }
            });
        }
    }
}

public static class SwaggerExtensions
{
    public static IServiceCollection AddSwaggerWithVersioning(this IServiceCollection services)
    {
        services.AddTransient<IConfigureOptions<SwaggerGenOptions>, ConfigureSwaggerOptions>();

        services.AddSwaggerGen(options =>
        {
            options.OperationFilter<SwaggerDefaultValues>();

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                In          = ParameterLocation.Header,
                Description = "Enter JWT Bearer token",
                Name        = "Authorization",
                Type        = SecuritySchemeType.Http,
                Scheme      = "bearer",
                BearerFormat = "JWT"
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id   = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        return services;
    }

    public static IApplicationBuilder UseSwaggerWithVersioning(
        this IApplicationBuilder app,
        IApiVersionDescriptionProvider provider)
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            foreach (var description in provider.ApiVersionDescriptions)
            {
                options.SwaggerEndpoint(
                    $"/swagger/{description.GroupName}/swagger.json",
                    $"Customer API {description.ApiVersion}");
            }
        });
        return app;
    }
}

public class SwaggerDefaultValues : Swashbuckle.AspNetCore.SwaggerGen.IOperationFilter
{
    public void Apply(
        Microsoft.OpenApi.Models.OpenApiOperation operation,
        Swashbuckle.AspNetCore.SwaggerGen.OperationFilterContext context)
    {
        var apiDescription = context.ApiDescription;
        operation.Deprecated = false;

        foreach (var responseType in context.ApiDescription.SupportedResponseTypes)
        {
            var responseKey = responseType.IsDefaultResponse
                ? "default"
                : responseType.StatusCode.ToString();

            if (!operation.Responses.TryGetValue(responseKey, out var response)) continue;

            foreach (var contentType in response.Content.Keys
                .Where(ct => !responseType.ApiResponseFormats.Any(f => f.MediaType == ct)).ToList())
            {
                response.Content.Remove(contentType);
            }
        }

        if (operation.Parameters is null) return;

        foreach (var parameter in operation.Parameters)
        {
            var description = apiDescription.ParameterDescriptions
                .FirstOrDefault(p => p.Name == parameter.Name);

            parameter.Description ??= description?.ModelMetadata?.Description;

            if (parameter.Schema.Default is null && description?.DefaultValue is not null)
            {
                parameter.Schema.Default = new Microsoft.OpenApi.Any.OpenApiString(
                    description.DefaultValue.ToString());
            }

            parameter.Required |= description?.IsRequired ?? false;
        }
    }
}
