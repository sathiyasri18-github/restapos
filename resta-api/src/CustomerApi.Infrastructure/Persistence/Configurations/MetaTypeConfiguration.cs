using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class MetaTypeConfiguration : IEntityTypeConfiguration<MetaType>
{
    public void Configure(EntityTypeBuilder<MetaType> builder)
    {
        builder.ToTable("MetaType");
        builder.HasKey(x => x.Id).HasName("PK_MetaType");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.HasIndex(x => x.Code).IsUnique();
        builder.Property(x => x.Name).HasMaxLength(100).IsRequired();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
    }
}
