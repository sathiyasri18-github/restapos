using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.StaticFiles;
using Resta.Web.Components;
using Resta.Web.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

builder.Services.AddHttpClient<ApiService>(client =>
{
    var apiUrl = builder.Configuration["ApiBaseUrl"] ?? "http://localhost:51269/";
    client.BaseAddress = new Uri(apiUrl);
});

builder.Services.AddSingleton<MediaUrlService>();

builder.Services.AddResponseCompression(opts =>
{
    opts.EnableForHttps = true;
    opts.Providers.Add<BrotliCompressionProvider>();
    opts.Providers.Add<GzipCompressionProvider>();
    opts.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
    [
        "text/css",
        "application/javascript",
        "text/javascript",
        "image/svg+xml",
        "application/json",
        "text/html",
    ]);
});
builder.Services.Configure<BrotliCompressionProviderOptions>(
    o => o.Level = System.IO.Compression.CompressionLevel.Optimal);
builder.Services.Configure<GzipCompressionProviderOptions>(
    o => o.Level = System.IO.Compression.CompressionLevel.Optimal);

var app = builder.Build();

app.UseResponseCompression();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

app.UseHttpsRedirection();

var provider = new FileExtensionContentTypeProvider();
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = provider,
    OnPrepareResponse = ctx =>
    {
        var path = ctx.File.Name;
        var headers = ctx.Context.Response.Headers;

        if (ctx.Context.Request.Path.StartsWithSegments("/_framework") ||
            ctx.Context.Request.Path.StartsWithSegments("/_content"))
        {
            headers.CacheControl = "public, max-age=31536000, immutable";
        }
        else if (path.EndsWith(".css") || path.EndsWith(".js"))
        {
            headers.CacheControl = "public, max-age=86400, must-revalidate";
        }
        else if (path.EndsWith(".woff2") || path.EndsWith(".woff") || path.EndsWith(".ttf"))
        {
            headers.CacheControl = "public, max-age=31536000, immutable";
        }
        else if (path.EndsWith(".jpg") || path.EndsWith(".jpeg") ||
                 path.EndsWith(".png")  || path.EndsWith(".webp") ||
                 path.EndsWith(".gif")  || path.EndsWith(".svg"))
        {
            headers.CacheControl = "public, max-age=604800";
        }
    }
});

app.UseAntiforgery();

app.MapGet("/sitemap.xml", async (IHttpClientFactory factory, IConfiguration config) =>
{
    var apiBase = config["ApiBaseUrl"] ?? "http://localhost:51269/";
    var siteBase = (config["SiteBaseUrl"] ?? "https://resta.com").TrimEnd('/');

    using var http = factory.CreateClient();
    http.BaseAddress = new Uri(apiBase);

    var now = DateTime.Now.ToString("yyyy-MM-dd");

    async Task<List<string>> Slugs(string path)
    {
        try
        {
            var json = await http.GetFromJsonAsync<ApiSlugResponse>(path);
            return json?.Data?.Select(x => x.Slug).Where(s => !string.IsNullOrEmpty(s)).ToList() ?? [];
        }
        catch { return []; }
    }

    var newsSlugs    = await Slugs("api/public/news/slugs");
    var serviceSlugs = await Slugs("api/public/services/slugs");

    var sb = new System.Text.StringBuilder();
    sb.AppendLine("""<?xml version="1.0" encoding="UTF-8"?>""");
    sb.AppendLine("""<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">""");

    void Url(string loc, string freq, string priority, string? lastmod = null)
    {
        sb.AppendLine("  <url>");
        sb.AppendLine($"    <loc>{siteBase}{loc}</loc>");
        if (lastmod != null) sb.AppendLine($"    <lastmod>{lastmod}</lastmod>");
        sb.AppendLine($"    <changefreq>{freq}</changefreq>");
        sb.AppendLine($"    <priority>{priority}</priority>");
        sb.AppendLine("  </url>");
    }

    Url("/",         "weekly",  "1.0", now);
    Url("/about",    "monthly", "0.8");
    Url("/our-story","monthly", "0.8");
    Url("/menu",     "weekly",  "0.9");
    Url("/gallery",  "monthly", "0.7");
    Url("/events",   "weekly",  "0.8");
    Url("/private-dining", "monthly", "0.7");
    Url("/careers",  "monthly", "0.6");
    Url("/videos",   "monthly", "0.6");
    Url("/news",     "daily",   "0.8");
    Url("/contact",  "yearly",  "0.7");

    foreach (var s in serviceSlugs) Url($"/menu/{s}", "monthly", "0.8");
    foreach (var s in newsSlugs)    Url($"/news/{s}", "yearly",  "0.6");

    sb.AppendLine("</urlset>");

    return Results.Content(sb.ToString(), "application/xml; charset=utf-8");
});

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();

internal record SlugItem(string Slug);
internal record ApiSlugResponse(List<SlugItem> Data);
