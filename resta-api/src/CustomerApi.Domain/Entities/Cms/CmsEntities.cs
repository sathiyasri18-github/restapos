using CustomerApi.Domain.Enums;

namespace CustomerApi.Domain.Entities.Cms;

public class NewsArticle : CmsBaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public NewsCategory Category { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string? Author { get; set; }
    public int ViewCount { get; set; }
}

public class GalleryAlbum : CmsBaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? Category { get; set; }
    public DateTime? EventDate { get; set; }
    public ICollection<GalleryImage> Images { get; set; } = [];
}

public class GalleryImage : CmsBaseEntity
{
    public int AlbumId { get; set; }
    public GalleryAlbum Album { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public int SortOrder { get; set; }
}

public class VideoItem : CmsBaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public VideoSource Source { get; set; }
    public string? VideoUrl { get; set; }
    public string? YouTubeId { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? Category { get; set; }
    public bool IsPublished { get; set; }
}

public class Advertisement : CmsBaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public AdvertisementPosition Position { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int SortOrder { get; set; }
}

public class BannerSlide : CmsBaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public int SortOrder { get; set; }
}

public class SiteMenuItem : CmsBaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Url { get; set; }
    public int? ParentId { get; set; }
    public SiteMenuItem? Parent { get; set; }
    public ICollection<SiteMenuItem> Children { get; set; } = [];
    public int SortOrder { get; set; }
    public bool OpenInNewTab { get; set; }
}

public class DynamicPage : CmsBaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? MetaDescription { get; set; }
    public string? MetaKeywords { get; set; }
    public bool IsPublished { get; set; }
}

public class ContactInquiry : CmsBaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public bool IsReplied { get; set; }
}

public class SiteSetting : CmsBaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class VisitorStat
{
    public int Id { get; set; }
    public long TotalVisitors { get; set; }
    public long TotalPageViews { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.Now;
}

public class EventItem : CmsBaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsPublished { get; set; }
}
public class ServiceOffering : CmsBaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? MetaKeywords { get; set; }
    public int SortOrder { get; set; }
    public int DemandRating { get; set; }
    public bool IsPublished { get; set; }
    public bool IsFeatured { get; set; }
    public int ViewCount { get; set; }
    public ICollection<ServiceImage> Images { get; set; } = [];
}

public class ServiceImage : CmsBaseEntity
{
    public int ServiceId { get; set; }
    public ServiceOffering Service { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public int SortOrder { get; set; }
}
