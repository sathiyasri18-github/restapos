using System.Text.RegularExpressions;
using CustomerApi.Application.Cms;
using CustomerApi.Domain.Entities.Cms;
using CustomerApi.Domain.Enums;
using CustomerApi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.Infrastructure.Services.Cms;

public partial class CmsContentServices(ApplicationDbContext db)
{
    protected ApplicationDbContext Db { get; } = db;

    protected static string GenerateSlug(string title)
    {
        var slug = title.ToLowerInvariant().Trim();
        slug = NonAlphaRegex().Replace(slug, "");
        slug = SpaceRegex().Replace(slug, "-");
        return slug.Trim('-');
    }

    [GeneratedRegex(@"[^a-z0-9\s-]")]
    private static partial Regex NonAlphaRegex();
    [GeneratedRegex(@"\s+")]
    private static partial Regex SpaceRegex();
}

public class NewsService(ApplicationDbContext db) : CmsContentServices(db), INewsService
{
    public async Task<PagedResult<NewsDto>> GetPublishedAsync(int page, int pageSize, NewsCategory? category = null)
    {
        var query = Db.NewsArticles.AsNoTracking().Where(x => x.IsPublished && x.IsActive);
        if (category.HasValue) query = query.Where(x => x.Category == category);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(x => x.PublishedAt).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new NewsDto(x.Id, x.Title, x.Slug, x.Summary, x.ImageUrl, x.Category, x.IsPublished, x.PublishedAt, x.Author, x.ViewCount)).ToListAsync();
        return new PagedResult<NewsDto>(items, total, page, pageSize);
    }
    public async Task<NewsDetailDto?> GetBySlugAsync(string slug)
    {
        var article = await Db.NewsArticles.AsNoTracking().FirstOrDefaultAsync(x => x.Slug == slug && x.IsPublished && x.IsActive);
        if (article == null) return null;
        await Db.NewsArticles.Where(x => x.Id == article.Id).ExecuteUpdateAsync(s => s.SetProperty(x => x.ViewCount, x => x.ViewCount + 1));
        return new NewsDetailDto(article.Id, article.Title, article.Slug, article.Summary, article.Content, article.ImageUrl, article.Category, article.PublishedAt, article.Author, article.ViewCount + 1);
    }
    public async Task<PagedResult<NewsDto>> GetAllAsync(int page, int pageSize)
    {
        var total = await Db.NewsArticles.CountAsync(x => x.IsActive);
        var items = await Db.NewsArticles.AsNoTracking().Where(x => x.IsActive).OrderByDescending(x => x.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new NewsDto(x.Id, x.Title, x.Slug, x.Summary, x.ImageUrl, x.Category, x.IsPublished, x.PublishedAt, x.Author, x.ViewCount)).ToListAsync();
        return new PagedResult<NewsDto>(items, total, page, pageSize);
    }
    public async Task<NewsDetailDto?> GetByIdAsync(int id)
    {
        var x = await Db.NewsArticles.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id && a.IsActive);
        return x == null ? null : new NewsDetailDto(x.Id, x.Title, x.Slug, x.Summary, x.Content, x.ImageUrl, x.Category, x.PublishedAt, x.Author, x.ViewCount);
    }
    public async Task<NewsArticle> CreateAsync(CreateNewsRequest request)
    {
        var article = new NewsArticle { Title = request.Title, Slug = GenerateSlug(request.Title), Summary = request.Summary, Content = request.Content, ImageUrl = request.ImageUrl, Category = request.Category, IsPublished = request.IsPublished, PublishedAt = request.IsPublished ? DateTime.Now : null, Author = request.Author };
        Db.NewsArticles.Add(article); await Db.SaveChangesAsync(); return article;
    }
    public async Task<NewsArticle?> UpdateAsync(int id, CreateNewsRequest request)
    {
        var article = await Db.NewsArticles.FindAsync(id); if (article == null) return null;
        article.Title = request.Title; article.Slug = GenerateSlug(request.Title); article.Summary = request.Summary; article.Content = request.Content; article.ImageUrl = request.ImageUrl; article.Category = request.Category; article.Author = request.Author; article.UpdatedAt = DateTime.Now;
        if (request.IsPublished && !article.IsPublished) article.PublishedAt = DateTime.Now; article.IsPublished = request.IsPublished;
        await Db.SaveChangesAsync(); return article;
    }
    public async Task<bool> DeleteAsync(int id) { var a = await Db.NewsArticles.FindAsync(id); if (a == null) return false; a.IsActive = false; await Db.SaveChangesAsync(); return true; }
    public async Task<bool> TogglePublishAsync(int id) { var a = await Db.NewsArticles.FindAsync(id); if (a == null) return false; a.IsPublished = !a.IsPublished; a.PublishedAt = a.IsPublished ? DateTime.Now : a.PublishedAt; await Db.SaveChangesAsync(); return true; }
}

public class GalleryService(ApplicationDbContext db) : CmsContentServices(db), IGalleryService
{
    public async Task<IReadOnlyList<GalleryAlbumDto>> GetAlbumsAsync() =>
        await Db.GalleryAlbums.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.EventDate ?? x.CreatedAt)
            .Select(x => new GalleryAlbumDto(
                x.Id, x.Title, x.Description, x.CoverImageUrl, x.Category, x.EventDate,
                x.Images.Count(i => i.IsActive)))
            .ToListAsync();
    public async Task<GalleryAlbumDto?> GetAlbumAsync(int id) =>
        await Db.GalleryAlbums.AsNoTracking()
            .Where(x => x.Id == id && x.IsActive)
            .Select(x => new GalleryAlbumDto(
                x.Id, x.Title, x.Description, x.CoverImageUrl, x.Category, x.EventDate,
                x.Images.Count(i => i.IsActive)))
            .FirstOrDefaultAsync();
    public async Task<IReadOnlyList<GalleryImageDto>> GetImagesAsync(int albumId) => await Db.GalleryImages.AsNoTracking().Where(x => x.AlbumId == albumId && x.IsActive).OrderBy(x => x.SortOrder).Select(x => new GalleryImageDto(x.Id, x.AlbumId, x.Title, x.ImageUrl, x.Caption, x.SortOrder)).ToListAsync();
    public async Task<IReadOnlyList<GalleryImageDto>> GetSlideshowImagesAsync(int limit = 10)
    {
        var ids = await Db.GalleryAlbums.AsNoTracking().Where(x => x.IsActive && x.Category == "Slideshow").Select(x => x.Id).ToListAsync();
        var query = Db.GalleryImages.AsNoTracking().Where(x => x.IsActive && x.Album.IsActive);
        if (ids.Count > 0) query = query.Where(x => ids.Contains(x.AlbumId));
        return await query.OrderBy(x => x.AlbumId).ThenBy(x => x.SortOrder).Take(limit).Select(x => new GalleryImageDto(x.Id, x.AlbumId, x.Title, x.ImageUrl, x.Caption, x.SortOrder)).ToListAsync();
    }
    public async Task<GalleryAlbum> CreateAlbumAsync(CreateAlbumRequest request) { var album = new GalleryAlbum { Title = request.Title, Description = request.Description, Category = request.Category, EventDate = request.EventDate }; Db.GalleryAlbums.Add(album); await Db.SaveChangesAsync(); return album; }
    public async Task<GalleryAlbum?> UpdateAlbumAsync(int id, CreateAlbumRequest request) { var album = await Db.GalleryAlbums.FindAsync(id); if (album == null) return null; album.Title = request.Title; album.Description = request.Description; album.Category = request.Category; album.EventDate = request.EventDate; album.UpdatedAt = DateTime.Now; await Db.SaveChangesAsync(); return album; }
    public async Task<bool> DeleteAlbumAsync(int id) { var album = await Db.GalleryAlbums.FindAsync(id); if (album == null) return false; album.IsActive = false; await Db.SaveChangesAsync(); return true; }
    public async Task<GalleryImage> AddImageAsync(int albumId, string title, string imageUrl, string? caption, int sortOrder) { var image = new GalleryImage { AlbumId = albumId, Title = title, ImageUrl = imageUrl, Caption = caption, SortOrder = sortOrder }; Db.GalleryImages.Add(image); var album = await Db.GalleryAlbums.FindAsync(albumId); if (album != null && album.CoverImageUrl == null) album.CoverImageUrl = imageUrl; await Db.SaveChangesAsync(); return image; }
    public async Task<bool> DeleteImageAsync(int imageId) { var image = await Db.GalleryImages.FindAsync(imageId); if (image == null) return false; image.IsActive = false; await Db.SaveChangesAsync(); return true; }
}

public class VideoService(ApplicationDbContext db) : CmsContentServices(db), IVideoService
{
    public async Task<IReadOnlyList<VideoDto>> GetPublishedAsync() => await Db.Videos.AsNoTracking().Where(x => x.IsPublished && x.IsActive).OrderByDescending(x => x.CreatedAt).Select(x => new VideoDto(x.Id, x.Title, x.Description, x.Source, x.VideoUrl, x.YouTubeId, x.ThumbnailUrl, x.Category, x.IsPublished)).ToListAsync();
    public async Task<IReadOnlyList<VideoDto>> GetAllAsync() => await Db.Videos.AsNoTracking().Where(x => x.IsActive).Select(x => new VideoDto(x.Id, x.Title, x.Description, x.Source, x.VideoUrl, x.YouTubeId, x.ThumbnailUrl, x.Category, x.IsPublished)).ToListAsync();
    public async Task<VideoItem> CreateAsync(CreateVideoRequest request) { var video = new VideoItem { Title = request.Title, Description = request.Description, Source = request.Source, VideoUrl = request.VideoUrl, YouTubeId = request.YouTubeId, ThumbnailUrl = request.ThumbnailUrl, Category = request.Category, IsPublished = request.IsPublished }; Db.Videos.Add(video); await Db.SaveChangesAsync(); return video; }
    public async Task<VideoItem?> UpdateAsync(int id, CreateVideoRequest request) { var video = await Db.Videos.FindAsync(id); if (video == null) return null; video.Title = request.Title; video.Description = request.Description; video.Source = request.Source; video.VideoUrl = request.VideoUrl; video.YouTubeId = request.YouTubeId; video.ThumbnailUrl = request.ThumbnailUrl; video.Category = request.Category; video.IsPublished = request.IsPublished; video.UpdatedAt = DateTime.Now; await Db.SaveChangesAsync(); return video; }
    public async Task<bool> DeleteAsync(int id) { var video = await Db.Videos.FindAsync(id); if (video == null) return false; video.IsActive = false; await Db.SaveChangesAsync(); return true; }
}
