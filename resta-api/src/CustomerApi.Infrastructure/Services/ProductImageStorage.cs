using CustomerApi.Application.Common.Interfaces;
using Microsoft.AspNetCore.Hosting;

namespace CustomerApi.Infrastructure.Services;

public class ProductImageStorage(IWebHostEnvironment environment) : IProductImageStorage
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/gif", "image/webp"
    };

    private const long MaxBytes = 5 * 1024 * 1024;

    public async Task<string> SaveProductImageAsync(
        int productId,
        Stream content,
        string fileName,
        string contentType,
        CancellationToken ct = default)
    {
        if (productId <= 0)
            throw new ArgumentException("Product id is required.", nameof(productId));

        if (content is null || !content.CanRead)
            throw new ArgumentException("Image content is required.", nameof(content));

        var extension = Path.GetExtension(fileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
            throw new InvalidOperationException("Only JPG, PNG, GIF, and WEBP images are allowed.");

        if (!string.IsNullOrWhiteSpace(contentType) && !AllowedContentTypes.Contains(contentType))
            throw new InvalidOperationException("Unsupported image content type.");

        if (content.CanSeek)
        {
            if (content.Length > MaxBytes)
                throw new InvalidOperationException("Image must be 5 MB or smaller.");
        }

        var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        var uploadDir = Path.Combine(webRoot, "uploads", "products");
        Directory.CreateDirectory(uploadDir);

        var safeExtension = extension.ToLowerInvariant();
        var storedName = $"{productId}_{Guid.NewGuid():N}{safeExtension}";
        var physicalPath = Path.Combine(uploadDir, storedName);

        await using (var output = new FileStream(physicalPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await content.CopyToAsync(output, ct);
        }

        var fileInfo = new FileInfo(physicalPath);
        if (fileInfo.Length > MaxBytes)
        {
            fileInfo.Delete();
            throw new InvalidOperationException("Image must be 5 MB or smaller.");
        }

        return $"uploads/products/{storedName}";
    }

    public Task DeleteProductImageAsync(string? relativePath, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            return Task.CompletedTask;

        var normalized = relativePath.Replace('\\', '/').TrimStart('/');
        if (!normalized.StartsWith("uploads/products/", StringComparison.OrdinalIgnoreCase))
            return Task.CompletedTask;

        var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        var physicalPath = Path.Combine(webRoot, normalized.Replace('/', Path.DirectorySeparatorChar));

        if (File.Exists(physicalPath))
            File.Delete(physicalPath);

        return Task.CompletedTask;
    }
}
