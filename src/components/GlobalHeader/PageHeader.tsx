import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { EditableText } from '@/components/ui/editable-text';
import { useHeaderActions } from '@/contexts/HeaderActionsContext';
import { cn } from '@/lib/utils';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface BreadcrumbItemType {
    label: string | React.ReactNode;
    href?: string;
    onClick?: (e: React.MouseEvent) => void;
    editable?: boolean;
    doubleClickToEdit?: boolean;
    onEdit?: (value: string) => void;
    onBlur?: () => void;
}

export interface PageHeaderProps {
    title: string | React.ReactNode;
    breadcrumbs: BreadcrumbItemType[];
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

    const handleBreadcrumbClick = (crumb: BreadcrumbItemType, e: React.MouseEvent) => {
        e.preventDefault();
        if (crumb.onClick) {
            crumb.onClick(e);
        } else if (crumb.href) {
            navigate(crumb.href);
        }
    };

    useEffect(() => {
        setCenterContent(
            children || (
                <div className="flex items-center h-full gap-2">
                    {/* Back Button - distinct from breadcrumb separators */}
                    {(onBack || backHref) && (
                        <button
                            onClick={handleBack}
                            className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all mr-1"
                            title="Go back"
                        >
                            <ArrowLeft size={14} strokeWidth={2} />
                        </button>
                    )}
                    <div className="flex flex-col justify-center">
                        <Breadcrumb className="mb-0.5">
                            <BreadcrumbList>
                                {breadcrumbs.map((crumb, index) => {
                                    const isFirst = index === 0;
                                    const isLast = index === breadcrumbs.length - 1;
                                    const isSingleBreadcrumb = breadcrumbs.length === 1;
                                    // Hide first item icon if back button is present
                                    const showIcon = isFirst && Icon && !(onBack || backHref);

                                    return (
                                        <React.Fragment key={index}>
                                            <BreadcrumbItem>
                                                {(crumb.href || crumb.onClick) && !isLast ? (
                                                    <BreadcrumbLink
                                                        href={crumb.href || "#"}
                                                        onClick={(e) => handleBreadcrumbClick(crumb, e)}
                                                        className={cn("flex items-center gap-2 cursor-pointer hover:text-slate-900")}
                                                    >
                                                        {showIcon && <Icon size={16} className="text-slate-500" />}
                                                        <span className="truncate max-w-[150px] sm:max-w-[300px]">{crumb.label}</span>
                                                    </BreadcrumbLink>
                                                ) : crumb.editable && crumb.onEdit ? (
                                                    <BreadcrumbPage className={cn("flex items-center gap-2", isLast && "font-bold tracking-tight text-slate-900")}>
                                                        {showIcon && <Icon size={16} className="text-slate-500" />}
                                                        <EditableText
                                                            value={typeof crumb.label === 'string' ? crumb.label : ''}
                                                            onChange={crumb.onEdit}
                                                            onBlur={crumb.onBlur}
                                                            doubleClickToEdit={crumb.doubleClickToEdit}
                                                            className={cn(isLast && "font-black tracking-tight text-slate-900")}
                                                        />
                                                    </BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbPage className={cn("flex items-center gap-2", isLast && "font-black tracking-tight text-slate-900")}>
                                                        {showIcon && <Icon size={18} className="text-slate-700" />}
                                                        <span className="truncate max-w-[150px] sm:max-w-[300px]">{crumb.label}</span>
                                                        {isSingleBreadcrumb && count !== undefined && (
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
    }, [setCenterContent, setActions, setTitleActions, title, breadcrumbs, count, actions, children, Icon, onBack, backHref, navigate]);

    return null;
};
