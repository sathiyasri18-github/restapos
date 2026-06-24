namespace CustomerApi.Application.Common.Interfaces;

public enum SiteAssetKind
{
    Logo,
    Favicon
}

public interface ISiteAssetStorage
{
    Task<string> SaveSiteAssetAsync(
        SiteAssetKind kind,
        Stream content,
        string fileName,
        string contentType,
        CancellationToken ct = default);

    Task DeleteSiteAssetAsync(string? relativePath, CancellationToken ct = default);
}
