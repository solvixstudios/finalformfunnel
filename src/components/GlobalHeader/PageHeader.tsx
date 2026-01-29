import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useHeaderActions } from '@/contexts/HeaderActionsContext';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface PageHeaderProps {
    title: string | React.ReactNode;
    breadcrumbs: { label: string; href?: string }[];
    count?: number;
    icon?: React.ElementType;
    onBack?: () => void;
    backHref?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    breadcrumbs,
    count,
    icon: Icon,
    onBack,
    backHref,
    actions,
    children,
}) => {
    const { setCenterContent, setActions, setTitleActions } = useHeaderActions();
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else if (backHref) {
            navigate(backHref);
        }
    };

    useEffect(() => {
        setCenterContent(
            children || (
                <div className="flex flex-col justify-center h-full">
                    <Breadcrumb className="mb-0.5">
                        <BreadcrumbList>
                            {breadcrumbs.map((crumb, index) => {
                                const isLast = index === breadcrumbs.length - 1;
                                return (
                                    <React.Fragment key={index}>
                                        <BreadcrumbItem>
                                            {crumb.href && !isLast ? (
                                                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                                            ) : (
                                                <BreadcrumbPage className={cn("flex items-center gap-2", isLast && "font-semibold text-slate-900")}>
                                                    {isLast && Icon && <Icon size={16} className="text-slate-500" />}
                                                    {crumb.label}
                                                    {isLast && count !== undefined && (
                                                        <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 min-w-[20px]">
                                                            {count}
                                                        </span>
                                                    )}
                                                </BreadcrumbPage>
                                            )}
                                        </BreadcrumbItem>
                                        {!isLast && <BreadcrumbSeparator />}
                                    </React.Fragment>
                                );
                            })}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            )
        );

        if (actions) {
            setActions(actions);
        }

        if (onBack || backHref) {
            setTitleActions(
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="mr-2 h-8 w-8 text-slate-500 hover:text-slate-900"
                >
                    <ChevronLeft size={18} />
                </Button>
            );
        }

        // Cleanup
        return () => {
            setCenterContent(null);
            setActions(null);
            setTitleActions(null);
        };
    }, [setCenterContent, setActions, setTitleActions, title, breadcrumbs, count, actions, children, Icon, onBack, backHref]);

    return null;
};
