namespace Resta.Web.Services;

/// <summary>
/// Resolves uploaded file paths (/uploads/...) to the API server origin.
/// </summary>
public class MediaUrlService
{
    private readonly string _apiOrigin;

    public MediaUrlService(IConfiguration configuration)
    {
        var mediaBase = configuration["MediaBaseUrl"];
        if (string.IsNullOrWhiteSpace(mediaBase))
        {
            var apiBase = configuration["ApiBaseUrl"] ?? "http://localhost:51269/";
            mediaBase = apiBase.TrimEnd('/');
        }

        _apiOrigin = mediaBase.TrimEnd('/');
    }

    public string Resolve(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return string.Empty;

        if (url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            url.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ||
            url.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            return url;

        var path = url.StartsWith('/') ? url : $"/{url}";
        if (path.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
            return $"{_apiOrigin}{path}";

        return $"{_apiOrigin}{path}";
    }
}
