using CustomerApi.Application.Cms;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace CustomerApi.Infrastructure.Services.Cms;

public class CmsFileStorageService : ICmsFileStorageService
{
    private readonly string _uploadPath;

    public CmsFileStorageService(IConfiguration configuration, IWebHostEnvironment environment)
    {
        var configured = configuration["FileStorage:CmsUploadPath"];

        if (!string.IsNullOrWhiteSpace(configured))
        {
            _uploadPath = Path.IsPathRooted(configured)
                ? configured
                : Path.Combine(environment.ContentRootPath, configured);
        }
        else
        {
            var webRoot = string.IsNullOrWhiteSpace(environment.WebRootPath)
                ? Path.Combine(environment.ContentRootPath, "wwwroot")
                : environment.WebRootPath;
            _uploadPath = Path.Combine(webRoot, "uploads", "cms");
        }

        Directory.CreateDirectory(_uploadPath);
    }

    public async Task<string> SaveFileAsync(Stream stream, string fileName, string folder)
    {
        var folderPath = Path.Combine(_uploadPath, folder);
        Directory.CreateDirectory(folderPath);

        var safeName = $"{Guid.NewGuid():N}_{Path.GetFileName(fileName)}";
        var fullPath = Path.Combine(folderPath, safeName);

        await using var fileStream = File.Create(fullPath);
        await stream.CopyToAsync(fileStream);

        return $"/uploads/cms/{folder}/{safeName}";
    }

    public Task<bool> DeleteFileAsync(string filePath)
    {
        var relative = filePath.TrimStart('/')
            .Replace("uploads/cms/", "", StringComparison.OrdinalIgnoreCase)
            .Replace("uploads/", "", StringComparison.OrdinalIgnoreCase);
        var fullPath = Path.Combine(_uploadPath, relative);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
            return Task.FromResult(true);
        }

        return Task.FromResult(false);
    }
}
