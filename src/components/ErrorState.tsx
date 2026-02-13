import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
}

export default function ErrorState({
    title = "오류가 발생했습니다",
    message = "데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    onRetry
}: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-card/30 backdrop-blur-sm border border-white/5 rounded-xl min-h-[300px]">
            <div className="p-4 bg-red-500/10 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
            {onRetry && (
                <Button onClick={onRetry} variant="outline" className="gap-2">
                    <RefreshCcw className="w-4 h-4" />
                    다시 시도
                </Button>
            )}
        </div>
    );
}
