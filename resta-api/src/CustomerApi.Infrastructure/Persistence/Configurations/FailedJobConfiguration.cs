using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class FailedJobConfiguration : IEntityTypeConfiguration<FailedJob>
{
    public void Configure(EntityTypeBuilder<FailedJob> builder)
    {
        builder.ToTable("FailedJob");
        builder.HasKey(x => x.Id).HasName("PK_FailedJob");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.Connection).IsRequired();
        builder.Property(x => x.Queue).IsRequired();
        builder.Property(x => x.Payload).IsRequired();
        builder.Property(x => x.Exception).IsRequired();
    }
}
