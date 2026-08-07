using CustomerApi.Domain.Entities.Cms;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class NewsArticleConfiguration : IEntityTypeConfiguration<NewsArticle>
{
    public void Configure(EntityTypeBuilder<NewsArticle> builder)
    {
        builder.ToTable("CmsNewsArticles");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(350).IsRequired();
        builder.Property(x => x.Summary).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.Author).HasMaxLength(200);
        builder.Property(x => x.ImageUrl).HasMaxLength(1000);
        builder.HasIndex(x => x.Slug).IsUnique();
    }
}

public class GalleryAlbumConfiguration : IEntityTypeConfiguration<GalleryAlbum>
{
    public void Configure(EntityTypeBuilder<GalleryAlbum> builder)
    {
        builder.ToTable("CmsGalleryAlbums");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.CoverImageUrl).HasMaxLength(1000);
        builder.Property(x => x.Category).HasMaxLength(100);
        builder.HasMany(x => x.Images).WithOne(x => x.Album).HasForeignKey(x => x.AlbumId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class GalleryImageConfiguration : IEntityTypeConfiguration<GalleryImage>
{
    public void Configure(EntityTypeBuilder<GalleryImage> builder)
    {
        builder.ToTable("CmsGalleryImages");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.ImageUrl).HasMaxLength(1000).IsRequired();
    }
}

public class VideoItemConfiguration : IEntityTypeConfiguration<VideoItem>
{
    public void Configure(EntityTypeBuilder<VideoItem> builder)
    {
        builder.ToTable("CmsVideos");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.VideoUrl).HasMaxLength(1000);
        builder.Property(x => x.YouTubeId).HasMaxLength(100);
        builder.Property(x => x.ThumbnailUrl).HasMaxLength(1000);
        builder.Property(x => x.Category).HasMaxLength(100);
    }
}

public class AdvertisementConfiguration : IEntityTypeConfiguration<Advertisement>
{
    public void Configure(EntityTypeBuilder<Advertisement> builder)
    {
        builder.ToTable("CmsAdvertisements");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.ImageUrl).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.LinkUrl).HasMaxLength(1000);
    }
}

public class BannerSlideConfiguration : IEntityTypeConfiguration<BannerSlide>
{
    public void Configure(EntityTypeBuilder<BannerSlide> builder)
    {
        builder.ToTable("CmsBannerSlides");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Subtitle).HasMaxLength(500);
        builder.Property(x => x.ImageUrl).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.LinkUrl).HasMaxLength(1000);
    }
}

public class SiteMenuItemConfiguration : IEntityTypeConfiguration<SiteMenuItem>
{
    public void Configure(EntityTypeBuilder<SiteMenuItem> builder)
    {
        builder.ToTable("CmsMenuItems");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Url).HasMaxLength(1000);
        builder.HasOne(x => x.Parent).WithMany(x => x.Children).HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class DynamicPageConfiguration : IEntityTypeConfiguration<DynamicPage>
{
    public void Configure(EntityTypeBuilder<DynamicPage> builder)
    {
        builder.ToTable("CmsDynamicPages");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(350).IsRequired();
        builder.Property(x => x.MetaDescription).HasMaxLength(500);
        builder.Property(x => x.MetaKeywords).HasMaxLength(500);
        builder.HasIndex(x => x.Slug).IsUnique();
    }
}

public class ContactInquiryConfiguration : IEntityTypeConfiguration<ContactInquiry>
{
    public void Configure(EntityTypeBuilder<ContactInquiry> builder)
    {
        builder.ToTable("CmsContactInquiries");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Phone).HasMaxLength(50);
        builder.Property(x => x.Subject).HasMaxLength(300).IsRequired();
    }
}

public class SiteSettingConfiguration : IEntityTypeConfiguration<SiteSetting>
{
    public void Configure(EntityTypeBuilder<SiteSetting> builder)
    {
        builder.ToTable("CmsSiteSettings");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Key).HasMaxLength(100).IsRequired();
        builder.HasIndex(x => x.Key).IsUnique();
    }
}

public class VisitorStatConfiguration : IEntityTypeConfiguration<VisitorStat>
{
    public void Configure(EntityTypeBuilder<VisitorStat> builder)
    {
        builder.ToTable("CmsVisitorStats");
        builder.HasKey(x => x.Id);
        builder.HasData(new VisitorStat
        {
            Id = 1,
            TotalVisitors = 0,
            TotalPageViews = 0,
            LastUpdated = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Unspecified)
        });
    }
}

public class EventItemConfiguration : IEntityTypeConfiguration<EventItem>
{
    public void Configure(EntityTypeBuilder<EventItem> builder)
    {
        builder.ToTable("CmsEvents");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Location).HasMaxLength(300);
        builder.Property(x => x.ImageUrl).HasMaxLength(1000);
    }
}

public class ServiceOfferingConfiguration : IEntityTypeConfiguration<ServiceOffering>
{
    public void Configure(EntityTypeBuilder<ServiceOffering> builder)
    {
        builder.ToTable("CmsServiceOfferings");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Subtitle).HasMaxLength(500);
        builder.Property(x => x.Slug).HasMaxLength(350).IsRequired();
        builder.Property(x => x.CoverImageUrl).HasMaxLength(1000);
        builder.Property(x => x.MetaTitle).HasMaxLength(300);
        builder.Property(x => x.MetaDescription).HasMaxLength(500);
        builder.Property(x => x.MetaKeywords).HasMaxLength(500);
        builder.HasIndex(x => x.Slug);
        builder.HasMany(x => x.Images).WithOne(x => x.Service).HasForeignKey(x => x.ServiceId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class ServiceImageConfiguration : IEntityTypeConfiguration<ServiceImage>
{
    public void Configure(EntityTypeBuilder<ServiceImage> builder)
    {
        builder.ToTable("CmsServiceImages");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.ImageUrl).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.Caption).HasMaxLength(500);
    }
}