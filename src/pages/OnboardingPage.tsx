import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Users, BarChart3, Megaphone, Sparkles, Check, Zap } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { OnboardingResponses, submitOnboardingSurvey } from '../hooks/useOnboarding';

interface OnboardingPageProps {
  userId: string;
  onComplete: () => void;
}

interface StepOption {
  value: string;
  label: string;
  description: string;
}

const STEPS = [
  {
    key: 'teamSize' as const,
    title: 'How big is your team?',
    subtitle: 'Helps us tailor features to your workflow.',
    icon: <Users size={20} />,
    options: [
      { value: 'solo', label: 'Just me', description: 'Solo entrepreneur' },
      { value: '2-5', label: '2–5 people', description: 'Small team' },
      { value: '6-20', label: '6–20 people', description: 'Growing business' },
      { value: '20+', label: '20+ people', description: 'Established company' },
    ] as StepOption[],
  },
  {
    key: 'businessSize' as const,
    title: 'Average orders per day?',
    subtitle: 'We\'ll optimize your dashboard for your volume.',
    icon: <BarChart3 size={20} />,
    options: [
      { value: '1-10', label: '1–10', description: 'Just starting out' },
      { value: '11-50', label: '11–50', description: 'Gaining traction' },
      { value: '51-200', label: '51–200', description: 'Scaling up' },
      { value: '200+', label: '200+', description: 'High volume' },
    ] as StepOption[],
  },
  {
    key: 'referralSource' as const,
    title: 'How did you find us?',
    subtitle: 'We\'d love to know what brought you here.',
    icon: <Megaphone size={20} />,
    options: [
      { value: 'social_media', label: 'Social Media', description: 'Facebook, Instagram, TikTok…' },
      { value: 'friend', label: 'Friend / Colleague', description: 'Word of mouth' },
      { value: 'search', label: 'Google Search', description: 'Found us online' },
      { value: 'ad', label: 'Advertisement', description: 'Saw an ad' },
      { value: 'other', label: 'Other', description: 'Tell us more' },
    ] as StepOption[],
  },
];

const OnboardingPage = ({ userId, onComplete }: OnboardingPageProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Partial<OnboardingResponses>>({});
  const [otherText, setOtherText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState(1);
  const otherInputRef = useRef<HTMLInputElement>(null);

  const step = STEPS[currentStep];
  const totalSteps = STEPS.length;
  const isLastStep = currentStep === totalSteps - 1;
  const selectedValue = responses[step.key] || '';
  const isOtherSelected = step.key === 'referralSource' && selectedValue === 'other';

  // Auto-focus the "Other" text input when selected
  useEffect(() => {
    if (isOtherSelected && otherInputRef.current) {
      otherInputRef.current.focus();
    }
  }, [isOtherSelected]);

  const handleSelect = (value: string) => {
    setResponses((prev) => ({ ...prev, [step.key]: value }));
  };

  const canProceed = selectedValue && !(isOtherSelected && !otherText.trim());

  const handleNext = async () => {
    if (!canProceed) return;

    if (isLastStep) {
      setIsSubmitting(true);
      try {
        const finalResponses = { ...responses } as OnboardingResponses;
        // If "other" is selected, store the typed text
        if (finalResponses.referralSource === 'other' && otherText.trim()) {
          finalResponses.referralSource = `other: ${otherText.trim()}`;
        }
        await submitOnboardingSurvey(userId, finalResponses);
        onComplete();
      } catch (err) {
        console.error('Failed to submit onboarding:', err);
        setIsSubmitting(false);
      }
    } else {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#F8F5F1] font-sans">

      {/* ─── Left Panel ─── */}
      <div className="w-full lg:w-[55%] h-full flex flex-col bg-white">

        {/* Top bar */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-8 lg:px-12 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white fill-white" />
            </div>
            <span className="font-black text-slate-900 tracking-tight text-sm">Final Form</span>
          </div>

          {/* Progress pills */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                  idx < currentStep
                    ? 'bg-[#FF5A1F] w-3'
                    : idx === currentStep
                    ? 'bg-[#FF5A1F] w-7'
                    : 'bg-slate-200 w-3'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Main Content — centered vertically */}
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 lg:px-12 min-h-0">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* Step badge + heading */}
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold tracking-widest uppercase mb-3">
                    {step.icon}
                    <span>Step {currentStep + 1}/{totalSteps}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    {step.title}
                  </h1>
                  <p className="text-slate-400 text-sm font-medium mt-1.5">{step.subtitle}</p>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {step.options.map((option) => {
                    const isSelected = selectedValue === option.value;
                    return (
                      <motion.button
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        whileTap={{ scale: 0.985 }}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 group
                          ${isSelected
                            ? 'border-[#FF5A1F] bg-[#FF5A1F]/5 shadow-sm shadow-[#FF5A1F]/10'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-[#F8F5F1]'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`font-bold text-sm ${isSelected ? 'text-[#FF5A1F]' : 'text-slate-900'}`}>
                              {option.label}
                            </div>
                            <div className={`text-xs mt-0.5 ${isSelected ? 'text-[#FF5A1F]/70' : 'text-slate-400'}`}>
                              {option.description}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200
                            ${isSelected
                              ? 'border-[#FF5A1F] bg-[#FF5A1F]'
                              : 'border-slate-200 group-hover:border-[#FF5A1F]/50'
                            }`}
                          >
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                              >
                                <Check size={12} className="text-white" strokeWidth={3} />
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}

                  {/* "Other" free text input */}
                  {isOtherSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <input
                        ref={otherInputRef}
                        type="text"
                        value={otherText}
                        onChange={(e) => setOtherText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
                        placeholder="Please specify…"
                        className="w-full px-4 py-3 mt-1 rounded-xl border border-slate-200 bg-white shadow-sm text-sm text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/20 focus:border-[#FF5A1F] transition-all"
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-8 lg:px-12 py-5 border-t border-slate-100">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              currentStep === 0
                ? 'text-slate-200 cursor-not-allowed'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-sm
              ${canProceed && !isSubmitting
                ? 'bg-[#FF5A1F] text-white hover:bg-[#E04812] active:scale-[0.97]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving
              </>
            ) : isLastStep ? (
              <>
                Get Started
                <Sparkles size={14} />
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Right Panel (desktop only) ─── */}
      <div className="hidden lg:flex w-[45%] h-full bg-gradient-to-br from-[#FF5A1F] to-[#E04812] relative items-center justify-center p-12 xl:p-16 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/10 rounded-full blur-[60px] pointer-events-none translate-y-1/3 -translate-x-1/4" />

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 max-w-sm w-full"
          >
            <div className="bg-white/[0.04] backdrop-blur-xl p-8 xl:p-10 rounded-3xl border border-white/[0.06]">
              {/* Icon */}
              <div className="w-12 h-12 mb-5 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/60">
                {step.icon}
              </div>

              <h2 className="text-xl xl:text-2xl font-black text-white tracking-tight mb-2 leading-tight">
                {currentStep === 0 && 'Built for teams of any size'}
                {currentStep === 1 && 'Scales with your growth'}
                {currentStep === 2 && 'Join thousands of merchants'}
              </h2>
              <p className="text-white/40 text-sm leading-relaxed">
                {currentStep === 0 && 'Whether you\'re solo or managing a large team, Final Form adapts to your needs.'}
                {currentStep === 1 && 'From 10 to 10,000 orders a day — our infrastructure handles it with zero lag.'}
                {currentStep === 2 && 'Merchants across Algeria trust Final Form to power their sales.'}
              </p>

              {/* Step dots */}
              <div className="flex gap-1.5 mt-6">
                {STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      idx === currentStep ? 'bg-white/60 w-5' : 'bg-white/10 w-2'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
              className="absolute -right-4 -top-4 bg-white text-slate-900 p-3 rounded-2xl shadow-lg rotate-12"
            >
              <Sparkles size={20} />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center text-[10px] font-medium text-white/20 tracking-wider uppercase">
          © {new Date().getFullYear()} Solvix Studios
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
