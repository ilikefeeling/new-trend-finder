import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function TableRowSkeleton() {
    return (
        <Card className="bg-card/40 backdrop-blur-md border-white/5">
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div className="flex gap-4 w-full">
                        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                        <div className="space-y-2 w-full">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-[120px]" />
                                <Skeleton className="h-5 w-[60px] rounded-full" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <Skeleton className="h-4 w-[140px]" />
                                <Skeleton className="h-4 w-[100px]" />
                                <Skeleton className="h-4 w-[120px]" />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
