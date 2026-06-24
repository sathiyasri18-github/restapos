using CustomerApi.Application.Common.Interfaces;
using Microsoft.AspNetCore.Hosting;

namespace CustomerApi.Infrastructure.Services;

public class SiteAssetStorage(IWebHostEnvironment environment) : ISiteAssetStorage
{
    private static readonly HashSet<string> LogoExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp"
    };

    private static readonly HashSet<string> FaviconExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".ico", ".png", ".gif", ".webp", ".jpg", ".jpeg"
    };

    private static readonly HashSet<string> ImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/x-icon", "image/vnd.microsoft.icon"
    };

    private const long MaxBytes = 2 * 1024 * 1024;

    public async Task<string> SaveSiteAssetAsync(
        SiteAssetKind kind,
        Stream content,
        string fileName,
        string contentType,
        CancellationToken ct = default)
    {
        if (content is null || !content.CanRead)
            throw new ArgumentException("File content is required.", nameof(content));

        var extension = Path.GetExtension(fileName);
        var allowed = kind == SiteAssetKind.Favicon ? FaviconExtensions : LogoExtensions;
        if (string.IsNullOrWhiteSpace(extension) || !allowed.Contains(extension))
        {
            var allowedList = string.Join(", ", allowed);
            throw new InvalidOperationException($"Allowed file types: {allowedList}.");
        }

        if (!string.IsNullOrWhiteSpace(contentType) && !ImageContentTypes.Contains(contentType))
            throw new InvalidOperationException("Unsupported image content type.");

        if (content.CanSeek && content.Length > MaxBytes)
            throw new InvalidOperationException("File must be 2 MB or smaller.");

        var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        var uploadDir = Path.Combine(webRoot, "uploads", "site");
        Directory.CreateDirectory(uploadDir);

        var prefix = kind == SiteAssetKind.Favicon ? "favicon" : "logo";
        var storedName = $"{prefix}_{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var physicalPath = Path.Combine(uploadDir, storedName);

        await using (var output = new FileStream(physicalPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await content.CopyToAsync(output, ct);
        }

        var fileInfo = new FileInfo(physicalPath);
        if (fileInfo.Length > MaxBytes)
        {
            fileInfo.Delete();
            throw new InvalidOperationException("File must be 2 MB or smaller.");
        }

        return $"uploads/site/{storedName}";
    }

    public Task DeleteSiteAssetAsync(string? relativePath, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            return Task.CompletedTask;

        var normalized = relativePath.Replace('\\', '/').TrimStart('/');
        if (!normalized.StartsWith("uploads/site/", StringComparison.OrdinalIgnoreCase))
            return Task.CompletedTask;

        var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        var physicalPath = Path.Combine(webRoot, normalized.Replace('/', Path.DirectorySeparatorChar));

        if (File.Exists(physicalPath))
            File.Delete(physicalPath);

        return Task.CompletedTask;
    }
}
