'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Loader2,
  Mail,
  Pencil,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button, Card, Input, toast } from '@/components/ui';
import { cn } from '@/lib/utils';

type PaymentMethod = 'upi' | 'bank';
type SettingsStep = 'contact' | 'payout' | 'confirm';

type SavedPaymentDetails = {
  payment_contact_email: string;
  payment_method: PaymentMethod;
  upi_id?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
};

const steps: { id: SettingsStep; label: string; icon: typeof Mail }[] = [
  { id: 'contact', label: 'Payment Contact', icon: Mail },
  { id: 'payout', label: 'Payout Account', icon: IndianRupee },
  { id: 'confirm', label: 'Confirm', icon: CheckCircle2 },
];

const formatAccountNumber = (value: string) =>
  value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');

const parseAccountNumber = (value: string) => value.replace(/\D/g, '');

const maskAccountNumber = (value: string) => `****${String(value).slice(-4)}`;

const maskUpiId = (value: string) => {
  const domain = value.split('@')[1];
  return domain ? `••••@${domain}` : '••••';
};

export default function OwnerSettingsPage() {
  const router = useRouter();
  const { user, role, isLoading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState<SettingsStep>('contact');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [paymentContactEmail, setPaymentContactEmail] = useState('');

  const [savedDetails, setSavedDetails] = useState<SavedPaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSavedView, setIsSavedView] = useState(false);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const isStepComplete = (index: number) =>
    isSavedView || currentStepIndex > index;

  const isStepActive = (index: number) =>
    !isSavedView && currentStepIndex === index;

  const populateFormFromSaved = (data: SavedPaymentDetails) => {
    setPaymentContactEmail(data.payment_contact_email || '');
    setPaymentMethod(data.payment_method);

    if (data.payment_method === 'upi') {
      setUpiId(data.upi_id || '');
      setAccountNumber('');
      setConfirmAccountNumber('');
      setIfsc('');
      setBeneficiaryName('');
    } else {
      setUpiId('');
      setAccountNumber(data.bank_account_number || '');
      setConfirmAccountNumber(data.bank_account_number || '');
      setIfsc(data.bank_ifsc || '');
      setBeneficiaryName(data.bank_account_name || '');
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login?redirect=/owner-settings');
      return;
    }

    if (role !== null && role !== 'owner') {
      router.push('/');
      return;
    }

    if (role !== 'owner') return;

    const loadSettings = async () => {
      try {
        const res = await fetch(`/api/owner/payment-settings?userId=${user.id}`);
        const result = await res.json();

        if (result.success && result.data) {
          const data = result.data as SavedPaymentDetails;

          if (data.payment_method && data.payment_contact_email) {
            setSavedDetails(data);
            populateFormFromSaved(data);
            setIsSavedView(true);
            setCurrentStep('confirm');
          } else {
            if (data.payment_contact_email) {
              setPaymentContactEmail(data.payment_contact_email);
            } else if (user.email) {
              setPaymentContactEmail(user.email);
            }
            if (data.payment_method === 'upi' || data.payment_method === 'bank') {
              setPaymentMethod(data.payment_method);
            }
          }
        } else if (user.email) {
          setPaymentContactEmail(user.email);
        }
      } catch (error) {
        console.error('Failed to load payment settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user, role, authLoading, router]);

  const validateContact = () => {
    if (!paymentContactEmail.trim()) {
      toast.error('Please enter a contact email for payment updates');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentContactEmail.trim())) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validatePayout = () => {
    if (paymentMethod === 'upi') {
      if (!upiId.trim()) {
        toast.error('Please enter your UPI ID');
        return false;
      }
      if (!/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim())) {
        toast.error('Please enter a valid UPI ID');
        return false;
      }
    } else {
      if (!accountNumber.trim() || !confirmAccountNumber.trim() || !ifsc.trim() || !beneficiaryName.trim()) {
        toast.error('Please fill all bank details');
        return false;
      }
      if (accountNumber.trim() !== confirmAccountNumber.trim()) {
        toast.error('Account numbers do not match');
        return false;
      }
    }
    return true;
  };

  const goToNextStep = () => {
    if (currentStep === 'contact') {
      if (!validateContact()) return;
      setCurrentStep('payout');
    } else if (currentStep === 'payout') {
      if (!validatePayout()) return;
      setIsSavedView(false);
      setCurrentStep('confirm');
    }
  };

  const goToPreviousStep = () => {
    const stepOrder: SettingsStep[] = ['contact', 'payout', 'confirm'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setIsSavedView(false);
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleEdit = () => {
    if (savedDetails) {
      populateFormFromSaved(savedDetails);
    }
    setIsSavedView(false);
    setCurrentStep('contact');
  };

  const handleSave = async () => {
    if (!user) return;
    if (!validateContact() || !validatePayout()) return;

    setSaving(true);

    try {
      const body =
        paymentMethod === 'upi'
          ? {
              userId: user.id,
              payment_method: 'upi',
              upi_id: upiId.trim(),
              payment_contact_email: paymentContactEmail.trim(),
            }
          : {
              userId: user.id,
              payment_method: 'bank',
              bank_account_name: beneficiaryName.trim(),
              bank_account_number: accountNumber.trim(),
              bank_ifsc: ifsc.trim().toUpperCase(),
              payment_contact_email: paymentContactEmail.trim(),
            };

      const res = await fetch('/api/owner/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (result.success) {
        const data = result.data as SavedPaymentDetails;
        setSavedDetails(data);
        setIsSavedView(true);
        setCurrentStep('confirm');
      } else {
        toast.error(result.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save payment details');
    } finally {
      setSaving(false);
    }
  };

  const reviewDetails: SavedPaymentDetails | null = isSavedView
    ? savedDetails
    : {
        payment_contact_email: paymentContactEmail.trim(),
        payment_method: paymentMethod,
        upi_id: paymentMethod === 'upi' ? upiId.trim() : null,
        bank_account_name: paymentMethod === 'bank' ? beneficiaryName.trim() : null,
        bank_account_number: paymentMethod === 'bank' ? accountNumber.trim() : null,
        bank_ifsc: paymentMethod === 'bank' ? ifsc.trim().toUpperCase() : null,
      };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (role && role !== 'owner')) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground">Owner Settings</h1>
      <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
        Add your payout details here so we know where to send your earnings. Choose UPI for quick transfers, or add your bank account — whichever works best for you.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
        Planning to list your venue? Add your payment details below to get started.
      </p>

      {/* Progress Steps */}
      <div className="mb-8 mt-8 px-2">
        <div className="flex items-start">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn('flex', index < steps.length - 1 && 'flex-1')}
            >
              <div className="flex shrink-0 flex-col items-center">
                <div
                  className={cn(
                    'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background transition-all',
                    isStepComplete(index)
                      ? 'border-primary bg-primary text-background'
                      : isStepActive(index)
                        ? 'border-primary text-primary'
                        : 'border-border text-foreground-muted'
                  )}
                >
                  {isStepComplete(index) ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 max-w-[88px] text-center text-xs',
                    isStepActive(index) ? 'font-medium text-primary' : 'text-foreground-muted'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div className="flex flex-1 items-start px-2 pt-5">
                  <div
                    className={cn(
                      'h-0.5 w-full',
                      isStepComplete(index) ? 'bg-primary' : 'bg-border'
                    )}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="p-6">
        <AnimatePresence mode="wait">
          {currentStep === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-xl font-semibold text-foreground">Payment Contact</h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  How should ShiftsDeal reach you about payouts and payment updates?
                </p>
              </div>
              <Input
                label="Contact Email"
                type="email"
                placeholder="you@example.com"
                value={paymentContactEmail}
                onChange={(e) => setPaymentContactEmail(e.target.value)}
                required
              />
            </motion.div>
          )}

          {currentStep === 'payout' && (
            <motion.div
              key="payout"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-xl font-semibold text-foreground">Payout Account</h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  Choose how you would like to receive your earnings.
                </p>
              </div>

              <div className="flex gap-2 rounded-xl border border-border p-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={cn(
                    'flex-1 cursor-pointer rounded-lg py-2.5 text-sm font-medium transition-colors',
                    paymentMethod === 'upi'
                      ? 'border border-primary/50 bg-primary/10 text-primary shadow-sm'
                      : 'text-foreground-muted hover:bg-background-light hover:text-foreground'
                  )}
                >
                  UPI
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={cn(
                    'flex-1 cursor-pointer rounded-lg py-2.5 text-sm font-medium transition-colors',
                    paymentMethod === 'bank'
                      ? 'border border-primary/50 bg-primary/10 text-primary shadow-sm'
                      : 'text-foreground-muted hover:bg-background-light hover:text-foreground'
                  )}
                >
                  Bank Account
                </button>
              </div>

              {paymentMethod === 'upi' ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-background-light/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <IndianRupee className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">UPI</p>
                        <p className="text-xs text-foreground-muted">Receive payouts to your UPI ID</p>
                      </div>
                    </div>
                  </div>
                  <Input
                    label="UPI ID"
                    placeholder="yourname@oksbi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    label="Account No."
                    placeholder="1234 5678 9012 3456"
                    inputMode="numeric"
                    value={formatAccountNumber(accountNumber)}
                    onChange={(e) => setAccountNumber(parseAccountNumber(e.target.value))}
                    required
                  />
                  <Input
                    label="Confirm Account No."
                    placeholder="1234 5678 9012 3456"
                    inputMode="numeric"
                    value={formatAccountNumber(confirmAccountNumber)}
                    onChange={(e) => setConfirmAccountNumber(parseAccountNumber(e.target.value))}
                    required
                  />
                  <Input
                    label="IFSC"
                    placeholder="IFSC of the bank account"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    required
                  />
                  <Input
                    label="Beneficiary Name"
                    placeholder="Name as per bank account"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    required
                  />
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 'confirm' && reviewDetails && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {isSavedView && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Your details have been saved</p>
                    <p className="text-xs text-foreground-muted">
                      Payouts will be sent to the account below.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {isSavedView ? 'Payment Details Saved' : 'Review & Confirm'}
                </h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  {isSavedView
                    ? 'Your payment details are saved and ready for payouts.'
                    : 'Please review your payment details before saving.'}
                </p>
              </div>

              <Card className="divide-y divide-border p-0">
                <div className="p-4">
                  <h4 className="mb-1 font-medium text-foreground">Contact Email</h4>
                  <p className="text-sm text-foreground-muted">
                    {reviewDetails.payment_contact_email}
                  </p>
                </div>
                <div className="p-4">
                  <h4 className="mb-1 font-medium text-foreground">Payout Method</h4>
                  <p className="text-sm text-foreground-muted">
                    {reviewDetails.payment_method === 'upi' ? 'UPI' : 'Bank Account'}
                  </p>
                </div>
                <div className="p-4">
                  <h4 className="mb-1 font-medium text-foreground">Payout Details</h4>
                  {reviewDetails.payment_method === 'upi' ? (
                    <p className="text-sm text-foreground-muted">
                      {isSavedView && reviewDetails.upi_id
                        ? maskUpiId(reviewDetails.upi_id)
                        : reviewDetails.upi_id}
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-foreground-muted">
                        {reviewDetails.bank_account_name}
                      </p>
                      <p className="text-sm text-foreground-muted">
                        {reviewDetails.bank_account_number
                          ? isSavedView
                            ? `${maskAccountNumber(reviewDetails.bank_account_number)} • ${reviewDetails.bank_ifsc}`
                            : `${reviewDetails.bank_account_number} • ${reviewDetails.bank_ifsc}`
                          : '—'}
                      </p>
                    </>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex justify-between border-t border-border pt-6">
          {isSavedView ? (
            <>
              <div />
              <Button
                onClick={handleEdit}
                leftIcon={<Pencil className="h-4 w-4" />}
                className="cursor-pointer"
              >
                Edit Details
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={goToPreviousStep}
                disabled={currentStep === 'contact'}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
                className="cursor-pointer"
              >
                Back
              </Button>

              {currentStep === 'confirm' ? (
                <Button
                  onClick={handleSave}
                  isLoading={saving}
                  rightIcon={<Check className="h-4 w-4" />}
                  className="cursor-pointer"
                >
                  Save Payment Details
                </Button>
              ) : (
                <Button
                  onClick={goToNextStep}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                  className="cursor-pointer"
                >
                  Continue
                </Button>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
