using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class MetaConfiguration : IEntityTypeConfiguration<Meta>
{
    public void Configure(EntityTypeBuilder<Meta> builder)
    {
        builder.ToTable("Meta");
        builder.HasKey(x => x.Id).HasName("PK_Meta");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.Name).HasMaxLength(191).IsRequired();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.HasOne(x => x.MetaType)
            .WithMany()
            .HasForeignKey(x => x.MetaTypeId)
            .HasConstraintName("FK_Meta_MetaType");
        builder.HasIndex(x => new { x.MetaTypeId, x.Name }).IsUnique();
    }
}
