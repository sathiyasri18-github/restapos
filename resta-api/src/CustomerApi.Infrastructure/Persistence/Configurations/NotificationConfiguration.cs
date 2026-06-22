using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notification");
        builder.HasKey(x => x.Id).HasName("PK_Notification");
        builder.Property(x => x.Id).HasMaxLength(36);
        builder.Property(x => x.Id).IsRequired();
        builder.Property(x => x.Type).HasMaxLength(191);
        builder.Property(x => x.Type).IsRequired();
        builder.Property(x => x.NotifiableType).HasMaxLength(191);
        builder.Property(x => x.NotifiableType).IsRequired();
        builder.Property(x => x.Data).IsRequired();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Notification_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Notification_ModifiedDate");
    }
}
