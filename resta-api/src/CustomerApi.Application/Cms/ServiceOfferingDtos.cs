namespace CustomerApi.Application.Cms;

public record ServiceImageDto(int Id, int ServiceId, string Title, string ImageUrl, string? Caption, int SortOrder);
public record ServiceImageInput(string Title, string ImageUrl, string? Caption, int SortOrder);
public record ServiceDto(int Id, string Title, string? Subtitle, string Slug, string? CoverImageUrl, int SortOrder, int DemandRating, bool IsFeatured, bool IsPublished, int ImageCount);
public record ServiceDetailDto(int Id, string Title, string? Subtitle, string Slug, string Content, string? CoverImageUrl, string? MetaTitle, string? MetaDescription, string? MetaKeywords, int SortOrder, int DemandRating, bool IsFeatured, bool IsPublished, int ViewCount, IReadOnlyList<ServiceImageDto> Images);
public record CreateServiceRequest(string Title, string? Subtitle, string Content, string? CoverImageUrl, string? MetaTitle, string? MetaDescription, string? MetaKeywords, string? Slug, int SortOrder, int DemandRating, bool IsPublished, bool IsFeatured, IList<ServiceImageInput> Images);