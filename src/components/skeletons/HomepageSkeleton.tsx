import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const HomepageSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            {/* Hero Section Skeleton */}
            <section className="text-center mb-16">
                <div className="max-w-4xl mx-auto flex flex-col items-center">
                    <Skeleton className="h-12 w-3/4 md:w-1/2 mb-6" />
                    <Skeleton className="h-10 w-2/3 md:w-1/3 mb-6" />
                    <Skeleton className="h-24 w-full md:w-3/4 mb-8" />

                    {/* CTA Skeleton */}
                    <Skeleton className="h-20 w-64 rounded-xl" />
                </div>
            </section>

            {/* Quick Access Cards Skeleton */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="h-full">
                        <CardHeader className="text-center">
                            <Skeleton className="w-12 h-12 rounded-full mx-auto mb-4" />
                            <Skeleton className="h-6 w-1/2 mx-auto mb-2" />
                            <Skeleton className="h-4 w-3/4 mx-auto" />
                        </CardHeader>
                        <CardContent className="text-center">
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </section>

            {/* Welcome Message Skeleton */}
            <section className="bg-card rounded-2xl p-8 mb-16 border-2 border-border">
                <div className="text-center flex flex-col items-center">
                    <Skeleton className="w-16 h-16 rounded-full mb-6" />
                    <Skeleton className="h-8 w-1/3 mb-6" />
                    <Skeleton className="h-32 w-full md:w-2/3 mb-6" />
                    <Skeleton className="h-8 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
            </section>
        </div>
    );
};
