using CustomerApi.Domain.Enums;

namespace CustomerApi.Domain.DTOs;

public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);
public record ApiResponse<T>(bool Success, T? Data, string? Message = null);
public record NewsDto(int Id, string Title, string Slug, string Summary, string? ImageUrl, NewsCategory Category, bool IsPublished, DateTime? PublishedAt, string? Author, int ViewCount);
public record NewsDetailDto(int Id, string Title, string Slug, string Summary, string Content, string? ImageUrl, NewsCategory Category, DateTime? PublishedAt, string? Author, int ViewCount);
public record CreateNewsRequest(string Title, string Summary, string Content, string? ImageUrl, NewsCategory Category, bool IsPublished, string? Author);
public record GalleryAlbumDto(int Id, string Title, string? Description, string? CoverImageUrl, string? Category, DateTime? EventDate, int ImageCount);
public record GalleryImageDto(int Id, int AlbumId, string Title, string ImageUrl, string? Caption, int SortOrder);
public record CreateAlbumRequest(string Title, string? Description, string? Category, DateTime? EventDate);
public record VideoDto(int Id, string Title, string? Description, VideoSource Source, string? VideoUrl, string? YouTubeId, string? ThumbnailUrl, string? Category, bool IsPublished);
public record CreateVideoRequest(string Title, string? Description, VideoSource Source, string? VideoUrl, string? YouTubeId, string? ThumbnailUrl, string? Category, bool IsPublished);
public record AdvertisementDto(int Id, string Title, string ImageUrl, string? LinkUrl, AdvertisementPosition Position, DateTime StartDate, DateTime EndDate, int SortOrder);
public record BannerSlideDto(int Id, string Title, string? Subtitle, string ImageUrl, string? LinkUrl, int SortOrder);
public record MenuItemDto(int Id, string Title, string? Url, int? ParentId, int SortOrder, bool OpenInNewTab, List<MenuItemDto> Children);
public record DynamicPageDto(int Id, string Title, string Slug, string Content, string? MetaDescription, bool IsPublished);
public record ContactInquiryDto(int Id, string Name, string Email, string? Phone, string Subject, string Message, bool IsRead, DateTime CreatedAt);
public record SubmitContactRequest(string Name, string Email, string? Phone, string Subject, string Message);
public record EventDto(int Id, string Title, string? Description, string? Location, DateTime StartDate, DateTime? EndDate, string? ImageUrl, bool IsPublished);
public record VisitorStatsDto(long TotalVisitors, long TotalPageViews);
public record SiteSettingsDto(string AssociationName, string Tagline, string Address, string Phone, string Email, string? MapEmbedUrl, string? AboutContent, string? Vision, string? Mission, string? Objectives);