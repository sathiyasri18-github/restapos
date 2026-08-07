using CustomerApi.Domain.Entities.Cms;
using CustomerApi.Domain.Enums;

namespace CustomerApi.Application.Cms;

public interface INewsService
{
    Task<PagedResult<NewsDto>> GetPublishedAsync(int page, int pageSize, NewsCategory? category = null);
    Task<NewsDetailDto?> GetBySlugAsync(string slug);
    Task<PagedResult<NewsDto>> GetAllAsync(int page, int pageSize);
    Task<NewsDetailDto?> GetByIdAsync(int id);
    Task<NewsArticle> CreateAsync(CreateNewsRequest request);
    Task<NewsArticle?> UpdateAsync(int id, CreateNewsRequest request);
    Task<bool> DeleteAsync(int id);
    Task<bool> TogglePublishAsync(int id);
}
public interface IGalleryService
{
    Task<IReadOnlyList<GalleryAlbumDto>> GetAlbumsAsync();
    Task<GalleryAlbumDto?> GetAlbumAsync(int id);
    Task<IReadOnlyList<GalleryImageDto>> GetImagesAsync(int albumId);
    Task<IReadOnlyList<GalleryImageDto>> GetSlideshowImagesAsync(int limit = 10);
    Task<GalleryAlbum> CreateAlbumAsync(CreateAlbumRequest request);
    Task<GalleryAlbum?> UpdateAlbumAsync(int id, CreateAlbumRequest request);
    Task<bool> DeleteAlbumAsync(int id);
    Task<GalleryImage> AddImageAsync(int albumId, string title, string imageUrl, string? caption, int sortOrder);
    Task<bool> DeleteImageAsync(int imageId);
}
public interface IVideoService
{
    Task<IReadOnlyList<VideoDto>> GetPublishedAsync();
    Task<IReadOnlyList<VideoDto>> GetAllAsync();
    Task<VideoItem> CreateAsync(CreateVideoRequest request);
    Task<VideoItem?> UpdateAsync(int id, CreateVideoRequest request);
    Task<bool> DeleteAsync(int id);
}
public interface IAdvertisementService
{
    Task<IReadOnlyList<AdvertisementDto>> GetActiveAsync(AdvertisementPosition? position = null);
    Task<IReadOnlyList<AdvertisementDto>> GetAllAsync();
    Task<Advertisement> CreateAsync(AdvertisementDto dto);
    Task<Advertisement?> UpdateAsync(int id, AdvertisementDto dto);
    Task<bool> DeleteAsync(int id);
}
public interface IBannerService
{
    Task<IReadOnlyList<BannerSlideDto>> GetActiveAsync();
    Task<IReadOnlyList<BannerSlideDto>> GetAllAsync();
    Task<BannerSlide> CreateAsync(BannerSlideDto dto);
    Task<BannerSlide?> UpdateAsync(int id, BannerSlideDto dto);
    Task<bool> DeleteAsync(int id);
}
public interface ISiteMenuService
{
    Task<IReadOnlyList<MenuItemDto>> GetMenuTreeAsync();
    Task<SiteMenuItem> CreateAsync(MenuItemDto dto);
    Task<SiteMenuItem?> UpdateAsync(int id, MenuItemDto dto);
    Task<bool> DeleteAsync(int id);
}
public interface IPageService
{
    Task<DynamicPageDto?> GetBySlugAsync(string slug);
    Task<IReadOnlyList<DynamicPageDto>> GetAllAsync();
    Task<DynamicPage> CreateAsync(DynamicPageDto dto);
    Task<DynamicPage?> UpdateAsync(int id, DynamicPageDto dto);
    Task<bool> DeleteAsync(int id);
}
public interface IContactService
{
    Task<ContactInquiry> SubmitAsync(SubmitContactRequest request);
    Task<PagedResult<ContactInquiryDto>> GetAllAsync(int page, int pageSize);
    Task<bool> MarkAsReadAsync(int id);
    Task<bool> DeleteAsync(int id);
}
public interface IEventService
{
    Task<IReadOnlyList<EventDto>> GetPublishedAsync();
    Task<IReadOnlyList<EventDto>> GetAllAsync();
    Task<EventItem> CreateAsync(EventDto dto);
    Task<EventItem?> UpdateAsync(int id, EventDto dto);
    Task<bool> DeleteAsync(int id);
}


public interface IVisitorService
{
    Task<VisitorStatsDto> GetStatsAsync();
    Task RecordVisitAsync();
    Task RecordPageViewAsync();
}
public interface ISiteSettingsService
{
    Task<SiteSettingsDto> GetAsync();
    Task UpdateAsync(SiteSettingsDto settings);
}
public interface ICmsFileStorageService
{
    Task<string> SaveFileAsync(Stream stream, string fileName, string folder);
    Task<bool> DeleteFileAsync(string filePath);
}
