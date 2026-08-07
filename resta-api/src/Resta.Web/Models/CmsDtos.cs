namespace Resta.Web.Models;

public enum NewsCategory
{
    LatestNews = 1,
    PressRelease = 2,
    IndustryUpdate = 3,
    GovernmentAnnouncement = 4
}

public enum AdvertisementPosition
{
    HomeBanner = 1,
    Sidebar = 2,
    Footer = 3,
    Popup = 4
}

public enum VideoSource
{
    Upload = 1,
    YouTube = 2
}

public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);

public record ApiResponse<T>(bool Success, T? Data, string? Message = null);

public record NewsDto(int Id, string Title, string Slug, string Summary, string? ImageUrl, NewsCategory Category, bool IsPublished, DateTime? PublishedAt, string? Author, int ViewCount);
public record NewsDetailDto(int Id, string Title, string Slug, string Summary, string Content, string? ImageUrl, NewsCategory Category, DateTime? PublishedAt, string? Author, int ViewCount);

public record GalleryAlbumDto(int Id, string Title, string? Description, string? CoverImageUrl, string? Category, DateTime? EventDate, int ImageCount);
public record GalleryImageDto(int Id, int AlbumId, string Title, string ImageUrl, string? Caption, int SortOrder);

public record VideoDto(int Id, string Title, string? Description, VideoSource Source, string? VideoUrl, string? YouTubeId, string? ThumbnailUrl, string? Category, bool IsPublished);

public record AdvertisementDto(int Id, string Title, string ImageUrl, string? LinkUrl, AdvertisementPosition Position, DateTime StartDate, DateTime EndDate, int SortOrder);
public record BannerSlideDto(int Id, string Title, string? Subtitle, string ImageUrl, string? LinkUrl, int SortOrder);

public record MenuItemDto(int Id, string Title, string? Url, int? ParentId, int SortOrder, bool OpenInNewTab, List<MenuItemDto> Children);
public record DynamicPageDto(int Id, string Title, string Slug, string Content, string? MetaDescription, bool IsPublished);

public record ContactInquiryDto(int Id, string Name, string Email, string? Phone, string Subject, string Message, bool IsRead, DateTime CreatedAt);
public record SubmitContactRequest(string Name, string Email, string? Phone, string Subject, string Message);

public record EventDto(int Id, string Title, string? Description, string? Location, DateTime StartDate, DateTime? EndDate, string? ImageUrl, bool IsPublished);

public record ServiceImageDto(int Id, int ServiceId, string Title, string ImageUrl, string? Caption, int SortOrder);
public record ServiceDto(int Id, string Title, string? Subtitle, string Slug, string? CoverImageUrl, int SortOrder, int DemandRating, bool IsFeatured, bool IsPublished, int ImageCount);
public record ServiceDetailDto(int Id, string Title, string? Subtitle, string Slug, string Content, string? CoverImageUrl,
    string? MetaTitle, string? MetaDescription, string? MetaKeywords, int SortOrder, int DemandRating, bool IsFeatured, bool IsPublished,
    int ViewCount, IReadOnlyList<ServiceImageDto> Images);

public record VisitorStatsDto(long TotalVisitors, long TotalPageViews);

public record SiteSettingsDto(string AssociationName, string Tagline, string Address, string Phone, string Email, string? MapEmbedUrl, string? AboutContent, string? Vision, string? Mission, string? Objectives);
