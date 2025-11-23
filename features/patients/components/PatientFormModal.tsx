
import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Patient } from '../../../types';
import { User, Globe, Mail, Phone } from 'lucide-react';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Patient) => void;
  initialData?: Patient;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [formData, setFormData] = useState({
    name: '',
    countryCode: '+212',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Attempt to parse existing phone number
        let code = '+212';
        let num = initialData.phone;

        // Check if phone starts with + (e.g. +212 600...)
        const match = initialData.phone.match(/^(\+\d+)\s*(.*)$/);
        if (match) {
            code = match[1];
            num = match[2];
        }

        setFormData({
          name: initialData.name,
          countryCode: code,
          phone: num,
          email: initialData.email || ''
        });
      } else {
        setFormData({ name: '', countryCode: '+212', phone: '', email: '' });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { name?: string; phone?: string } = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Combine code and number
    const fullPhone = `${formData.countryCode.trim()} ${formData.phone.trim()}`;

    onSubmit({
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name,
      phone: fullPhone,
      email: formData.email
    });
    onClose();
  };

  // Simple helper to get flag based on code
  const getCountryFlag = (code: string) => {
    const cleanCode = code.replace('+', '').trim();
    switch (cleanCode) {
        case '212': return '🇲🇦'; // Morocco
        case '33': return '🇫🇷';  // France
        case '1': return '🇺🇸';   // USA
        case '34': return '🇪🇸';  // Spain
        case '39': return '🇮🇹';  // Italy
        case '44': return '🇬🇧';  // UK
        case '971': return '🇦🇪'; // UAE
        case '966': return '🇸🇦'; // KSA
        default: return '🌐';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Patient" : "Add New Patient"}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="flex flex-col items-center justify-center p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-100 dark:border-surface-700 mb-6">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 mb-2">
                <User size={32} />
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-400">
                {initialData ? 'Update patient information below' : 'Enter details for the new patient record'}
            </p>
        </div>

        <div className="space-y-5">
          {/* Name Field */}
          <Input
            label="Full Name"
            placeholder="e.g. John Doe"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            autoFocus
          />
          
          {/* Phone Section */}
          <div className="space-y-1.5">
             <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
                Phone Number
             </label>
             <div className="flex gap-3 items-start">
                <div className="w-32 shrink-0 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-lg select-none pointer-events-none">
                        {getCountryFlag(formData.countryCode)}
                    </div>
                    <Input
                        placeholder="+212"
                        value={formData.countryCode}
                        onChange={e => setFormData({ ...formData, countryCode: e.target.value })}
                        className="pl-10 font-medium text-surface-900 dark:text-white"
                    />
                </div>
                <div className="flex-1">
                    <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                        <Input
                            placeholder="600000000"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            error={errors.phone}
                            className="pl-10"
                        />
                    </div>
                </div>
             </div>
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
             <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
                Email Address (Optional)
             </label>
             <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <Input
                    type="email"
                    placeholder="e.g. john@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                />
             </div>
          </div>

        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-surface-100 dark:border-surface-700 mt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="min-w-[120px]">
            {initialData ? 'Update Patient' : 'Create Patient'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
