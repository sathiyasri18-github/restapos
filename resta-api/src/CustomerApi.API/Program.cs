using Asp.Versioning;
using Asp.Versioning.ApiExplorer;
using CustomerApi.API.Extensions;
using CustomerApi.API.Middleware;
using CustomerApi.Application;
using CustomerApi.Infrastructure;
using CustomerApi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services
    .AddApiVersioning(options =>
    {
        options.DefaultApiVersion = new ApiVersion(1, 0);
        options.AssumeDefaultVersionWhenUnspecified = true;
        options.ReportApiVersions = true;
        options.ApiVersionReader = ApiVersionReader.Combine(
            new UrlSegmentApiVersionReader(),
            new HeaderApiVersionReader("X-Api-Version"));
    })
    .AddApiExplorer(options =>
    {
        options.GroupNameFormat = "'v'VVV";
        options.SubstituteApiVersionInUrl = true;
    });

builder.Services.AddSwaggerWithVersioning();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);

builder.Services.AddCors(o => o.AddPolicy("AllowAll", p =>
    p.SetIsOriginAllowed(origin =>
            origin is "https://muruenterprises.info"
                or "https://www.muruenterprises.info"
                or "http://localhost:8080"
                or "http://localhost:4200"
                or "http://127.0.0.1:8080"
                or "http://127.0.0.1:4200")
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    await DatabaseInitializer.InitializeAsync(db, configuration, logger);
    await UserAccessBootstrap.EnsureAsync(scope.ServiceProvider);
}

app.UseCors("AllowAll");
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment() || app.Environment.EnvironmentName == "Docker")
{
    var provider = app.Services.GetRequiredService<IApiVersionDescriptionProvider>();
    app.UseSwaggerWithVersioning(provider);
}

var webRoot = app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "products"));
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.UseSwagger();
app.UseSwaggerUI();

app.Run();
