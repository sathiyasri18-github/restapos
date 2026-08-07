using System.Net.Http.Json;
using System.Text.Json;
using Resta.Web.Models;

namespace Resta.Web.Services;

public class ApiService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _http;

    public ApiService(HttpClient http) => _http = http;

    public async Task<T?> GetAsync<T>(string url) where T : class
    {
        try
        {
            var response = await _http.GetAsync(url);
            if (!response.IsSuccessStatusCode)
                return null;

            var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<T>>(JsonOptions);
            return apiResponse?.Data;
        }
        catch
        {
            return null;
        }
    }

    public async Task<bool> PostAsync<T>(string url, T data)
    {
        try
        {
            var response = await _http.PostAsJsonAsync(url, data, JsonOptions);
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    public async Task RecordPageViewAsync() => await _http.PostAsync("api/public/pageview", null);
}

public class HomePageData
{
    public List<BannerSlideDto> Banners { get; set; } = [];
    public List<NewsDto> FeaturedNews { get; set; } = [];
    public List<AdvertisementDto> Advertisements { get; set; } = [];
    public List<EventDto> UpcomingEvents { get; set; } = [];
    public List<ServiceDto> Services { get; set; } = [];
    public SiteSettingsDto? Settings { get; set; }
    public VisitorStatsDto? VisitorStats { get; set; }
}

public class GalleryDetailData
{
    public GalleryAlbumDto? Album { get; set; }
    public List<GalleryImageDto> Images { get; set; } = [];
}
