import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  GripVertical,
  Home,
  LayoutGrid,
  Lock,
  MousePointerClick,
  Package,
  Receipt,
  Shield,
  Smartphone,
  Tag,
  Ticket,
  Truck,
  Zap
} from "lucide-react";
import { SECTION_LABELS } from "../../../lib/constants";
import { useFormStore } from "../../../stores";
import { SortableItem } from "../components/SortableItem";
import { moveSection as moveSectionUtil } from "../utils/sectionHelpers";

export const SectionsListEditor = () => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);
  const setEditingSection = useFormStore((state) => state.setEditingSection);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = formConfig.sectionOrder.indexOf(active.id as string);
      const newIndex = formConfig.sectionOrder.indexOf(over?.id as string);

      moveSectionUtil(oldIndex, newIndex, formConfig, setFormConfig);
    }
  };

  return (
    <div className="space-y-4">
      {/* Fixed Header Section */}
      <div className="px-1">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-3">
          <Lock size={12} /> Section Fixe
        </h3>
        <div
          onClick={() => setEditingSection("header")}
          className="group bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-2 border-indigo-200 p-3 rounded-xl flex items-center gap-3 hover:border-indigo-300 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
            <Home size={16} />
          </div>
          <span className="flex-1 text-xs font-bold text-indigo-700">
            Header (En-tête)
          </span>
          <ChevronRight
            size={14}
            className="text-indigo-300 group-hover:text-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Movable Sections */}
      <div className="flex items-center justify-between px-1 pt-2 border-t border-slate-100">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
          <LayoutGrid size={14} /> Sections Mobiles
        </h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Glisser pour ordonner
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={formConfig.sectionOrder}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {formConfig.sectionOrder.map((sid: string) => (
              <SortableItem
                key={sid}
                id={sid}
                className="group bg-white border border-slate-100 p-3 rounded-xl flex items-center gap-3 hover:border-indigo-200 transition-all cursor-pointer touch-none"
              >
                <div
                  className="flex items-center gap-3 flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingSection(sid);
                  }}
                >
                  <GripVertical
                    size={16}
                    className="text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing"
                  />
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                    {sid === "variants" && <LayoutGrid size={16} />}
                    {sid === "shipping" && <Smartphone size={16} />}
                    {sid === "delivery" && <Truck size={16} />}
                    {sid === "offers" && <Tag size={16} />}
                    {sid === "promoCode" && <Ticket size={16} />}
                    {sid === "summary" && <Receipt size={16} />}
                    {sid === "cta" && <MousePointerClick size={16} />}
                    {sid === "urgencyText" && <Zap size={16} />}
                    {sid === "urgencyQuantity" && <Package size={16} />}
                    {sid === "urgencyTimer" && <Clock size={16} />}
                    {sid === "trustBadges" && <Shield size={16} />}
                  </div>
                  <span className="flex-1 text-xs font-bold text-slate-700">
                    {SECTION_LABELS[sid]?.fr || sid}
                  </span>
                </div>

                <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
                  {sid === "delivery" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormConfig({
                          ...formConfig,
                          hideDeliveryOption: !formConfig.hideDeliveryOption,
                        });
                      }}
                      className={`p-1.5 rounded transition-colors ${!formConfig.hideDeliveryOption ? "text-indigo-600 bg-indigo-50" : "text-slate-300 bg-slate-50"}`}
                    >
                      {!formConfig.hideDeliveryOption ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                    </button>
                  )}
                  {sid === "offers" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormConfig({
                          ...formConfig,
                          enableOffersSection:
                            formConfig.enableOffersSection === false ? true : false,
                        });
                      }}
                      className={`p-1.5 rounded transition-colors ${formConfig.enableOffersSection !== false ? "text-indigo-600 bg-indigo-50" : "text-slate-300 bg-slate-50"}`}
                    >
                      {formConfig.enableOffersSection !== false ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                    </button>
                  )}
                  {sid === "promoCode" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormConfig({
                          ...formConfig,
                          promoCode: {
                            ...formConfig.promoCode,
                            enabled: !formConfig.promoCode?.enabled,
                          },
                        });
                      }}
                      className={`p-1.5 rounded transition-colors ${formConfig.promoCode?.enabled ? "text-indigo-600 bg-indigo-50" : "text-slate-300 bg-slate-50"}`}
                    >
                      {formConfig.promoCode?.enabled ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                    </button>
                  )}
                  {sid === "summary" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormConfig({
                          ...formConfig,
                          enableSummarySection: !formConfig.enableSummarySection,
                        });
                      }}
                      className={`p-1.5 rounded transition-colors ${formConfig.enableSummarySection ? "text-indigo-600 bg-indigo-50" : "text-slate-300 bg-slate-50"}`}
                    >
                      {formConfig.enableSummarySection ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                    </button>
                  )}
                  {sid === "urgencyText" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormConfig({
                          ...formConfig,
                          urgencyText: {
                            ...formConfig.urgencyText,
                            enabled: !formConfig.urgencyText?.enabled,
                          },
                        });
                      }}
                      className={`p-1.5 rounded transition-colors ${formConfig.urgencyText?.enabled ? "text-indigo-600 bg-indigo-50" : "text-slate-300 bg-slate-50"}`}
                    >
                      {formConfig.urgencyText?.enabled ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                    </button>
                  )}
                  {sid === "urgencyQuantity" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormConfig({
                          ...formConfig,
                          urgencyQuantity: {
                            ...formConfig.urgencyQuantity,
                            enabled: !formConfig.urgencyQuantity?.enabled,
                          },
                        });
                      }}
                      className={`p-1.5 rounded transition-colors ${formConfig.urgencyQuantity?.enabled ? "text-indigo-600 bg-indigo-50" : "text-slate-300 bg-slate-50"}`}
                    >
                      {formConfig.urgencyQuantity?.enabled ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                    </button>
                  )}
                  {sid === "urgencyTimer" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormConfig({
                          ...formConfig,
                          urgencyTimer: {
                            ...formConfig.urgencyTimer,
                            enabled: !formConfig.urgencyTimer?.enabled,
                          },
                        });
                      }}
                      className={`p-1.5 rounded transition-colors ${formConfig.urgencyTimer?.enabled ? "text-indigo-600 bg-indigo-50" : "text-slate-300 bg-slate-50"}`}
                    >
                      {formConfig.urgencyTimer?.enabled ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                    </button>
                  )}
                  {sid === "trustBadges" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormConfig({
                          ...formConfig,
                          enableTrustBadges: !formConfig.enableTrustBadges,
                        });
                      }}
                      className={`p-1.5 rounded transition-colors ${formConfig.enableTrustBadges ? "text-indigo-600 bg-indigo-50" : "text-slate-300 bg-slate-50"}`}
                    >
                      {formConfig.enableTrustBadges ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                    </button>
                  )}
                  <ChevronRight
                    size={14}
                    className="text-slate-300 group-hover:text-indigo-400 transition-colors"
                  />
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

