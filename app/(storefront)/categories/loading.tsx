import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { CategoryCardSkeleton } from "@/components/skeletons/category-card-skeleton";

export default function CategoriesLoading() {
  return (
    <section className="section pt-0">
      <Container>
        <Grid cols={{ base: 2, sm: 3, lg: 4 }} gap="lg">
          {Array.from({ length: 8 }).map((_, i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </Grid>
      </Container>
    </section>
  );
}
