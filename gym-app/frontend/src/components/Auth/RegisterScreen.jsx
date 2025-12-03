// frontend/src/components/Auth/RegisterScreen.jsx
import React, { useState } from 'react';
import { CheckCircle, Loader, ArrowLeft, ArrowRight, User, Mail, Phone, CreditCard, Lock, Shield, Heart, Activity, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const RegisterScreen = () => {
  const [formStep, setFormStep] = useState(1); // 1: Personal, 2: Health, 3: Lifestyle, 4: Declaration, 5: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdminAccount, setIsAdminAccount] = useState(false);
  const { setCurrentScreen, handleRegister } = useApp();

  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    membershipType: 'Deluxe',
    password: '',
    confirmPassword: '',
    
    // Health & Medical Information
    hasMedicalConditions: '',
    medicalConditionsDetails: '',
    isOnMedication: '',
    medicationDetails: '',
    hasSurgeryOrInjury: '',
    surgeryOrInjuryDetails: '',
    hasChestPainOrDizziness: '',
    hasAllergies: '',
    allergiesDetails: '',
    isPregnant: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    
    // Lifestyle Information
    smokes: '',
    drinksAlcohol: '',
    exerciseFrequency: '',
    fitnessGoals: '',
    
    // Declaration
    agreedToDeclaration: false,
  });

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.dateOfBirth || 
        !formData.gender || !formData.address || !formData.password || !formData.confirmPassword) {
      setError('All personal information fields are required');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (!/^[0-9]{11}$/.test(formData.phone)) {
      setError('Phone number must be exactly 11 digits');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.hasMedicalConditions || !formData.isOnMedication || 
        !formData.hasSurgeryOrInjury || !formData.hasChestPainOrDizziness || 
        !formData.hasAllergies || !formData.emergencyContactName || !formData.emergencyContactPhone) {
      setError('All health information fields are required');
      return false;
    }
    if (formData.gender === 'Female' && !formData.isPregnant) {
      setError('Please answer the pregnancy question');
      return false;
    }
    if (!/^[0-9]{11}$/.test(formData.emergencyContactPhone)) {
      setError('Emergency contact phone must be 11 digits');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.smokes || !formData.drinksAlcohol || !formData.exerciseFrequency || !formData.fitnessGoals) {
      setError('All lifestyle fields are required');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!formData.agreedToDeclaration) {
      setError('You must agree to the declaration to proceed');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    setError('');
    if (formStep === 1 && !validateStep1()) return;
    if (formStep === 2 && !validateStep2()) return;
    if (formStep === 3 && !validateStep3()) return;
    setFormStep(formStep + 1);
  };

  const prevStep = () => {
    setError('');
    setFormStep(formStep - 1);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateStep4()) return;

    setLoading(true);
    const res = await handleRegister({
      ...formData,
      isAdmin: isAdminAccount,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.message || 'Registration failed');
      return;
    }

    setFormStep(5); // Success step
  };

  // Step 5: Success Screen
  if (formStep === 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden flex items-center justify-center p-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-96 h-96 bg-green-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 w-full max-w-2xl text-center">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12 shadow-2xl">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-green-500 blur-2xl opacity-50 rounded-full"></div>
              <CheckCircle size={100} className="relative z-10 text-green-400 drop-shadow-2xl" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4">Registration Complete!</h2>
            <p className="text-gray-300 mb-6 text-lg leading-relaxed">
              We've sent a verification link to <strong className="text-white">{formData.email}</strong>
            </p>
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-2xl p-6 mb-8 text-left backdrop-blur-sm">
              <p className="text-sm text-blue-200 font-bold mb-3 flex items-center gap-2">
                <Mail size={18} />
                Next Steps:
              </p>
              <ol className="text-sm text-blue-300 space-y-2 list-decimal list-inside">
                <li>Check your inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Return here and login to complete payment</li>
              </ol>
            </div>
            <button
              onClick={() => setCurrentScreen('login')}
              className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-xl hover:shadow-white/20 hover:scale-[1.02] duration-300"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Registration Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gray-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <button
        onClick={() => formStep === 1 ? setCurrentScreen('splash') : prevStep()}
        className="absolute top-6 left-6 z-20 text-white hover:text-gray-300 transition flex items-center gap-2 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-semibold">Back</span>
      </button>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 py-20">
        <div className="w-full max-w-3xl">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white font-semibold">Step {formStep} of 4</span>
                <span className="text-sm text-gray-400">{Math.round((formStep / 4) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(formStep / 4) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-white mb-2">
                {formStep === 1 && 'Personal Information'}
                {formStep === 2 && 'Health & Medical Information'}
                {formStep === 3 && 'Lifestyle Information'}
                {formStep === 4 && 'Declaration & Agreement'}
              </h1>
              <p className="text-gray-300 text-sm">1st Impression Gym & Fitness Center</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl backdrop-blur-sm">
                <p className="text-sm text-red-200 font-semibold flex items-center gap-2">
                  <AlertCircle size={18} />
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={formStep === 4 ? handleRegisterSubmit : (e) => { e.preventDefault(); nextStep(); }}>
              
              {/* STEP 1: PERSONAL INFORMATION */}
              {formStep === 1 && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <User size={16} />
                        Full Name *
                      </label>
                      <input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="John Doe"
                        className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-white mb-2">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white focus:border-white/40 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-white mb-2">Gender *</label>
                    <div className="flex gap-4">
                      {['Male', 'Female', 'Other'].map(gender => (
                        <label key={gender} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value={gender}
                            checked={formData.gender === gender}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                            className="w-4 h-4 accent-white"
                          />
                          <span className="text-white">{gender}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-white mb-2">Address *</label>
                    <input
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="123 Main Street, City"
                      className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <Phone size={16} />
                        Phone Number *
                      </label>
                      <input
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="08012345678"
                        pattern="[0-9]{11}"
                        maxLength={11}
                        className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <Mail size={16} />
                        Email Address *
                      </label>
                      <input
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="john@example.com"
                        type="email"
                        className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <CreditCard size={16} />
                      Membership Plan *
                    </label>
                    <select
                      value={formData.membershipType}
                      onChange={(e) => handleInputChange('membershipType', e.target.value)}
                      className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white focus:border-white/40 focus:outline-none"
                    >
                      <option value="Walk-in" className="bg-gray-900">Walk-in - ₦5,000 (1 day)</option>
                      <option value="Weekly" className="bg-gray-900">Weekly - ₦6,500 (7 days)</option>
                      <option value="Deluxe" className="bg-gray-900">Deluxe - ₦15,500 (30 days)</option>
                      <option value="Bi-Monthly" className="bg-gray-900">Bi-Monthly - ₦40,000 (90 days)</option>
                    </select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <Lock size={16} />
                        Create Password *
                      </label>
                      <input
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="••••••••"
                        type="password"
                        minLength={6}
                        className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <Lock size={16} />
                        Confirm Password *
                      </label>
                      <input
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="••••••••"
                        type="password"
                        className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Admin Checkbox */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAdminAccount}
                        onChange={(e) => setIsAdminAccount(e.target.checked)}
                        className="mt-1 w-5 h-5 accent-white cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2 text-white font-bold mb-1">
                          <Shield size={18} />
                          Register as Administrator
                        </div>
                        <p className="text-xs text-gray-400">
                          Check only if registering an admin account
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 2: HEALTH & MEDICAL INFORMATION */}
              {formStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                    <p className="text-sm text-blue-200 flex items-center gap-2">
                      <Heart size={16} />
                      Please answer honestly. This helps ensure your safety during physical activity.
                    </p>
                  </div>

                  <YesNoQuestion
                    label="1. Do you have any medical conditions?"
                    sublabel="(e.g., diabetes, hypertension, asthma, heart disease)"
                    value={formData.hasMedicalConditions}
                    onChange={(val) => handleInputChange('hasMedicalConditions', val)}
                    details={formData.medicalConditionsDetails}
                    onDetailsChange={(val) => handleInputChange('medicalConditionsDetails', val)}
                  />

                  <YesNoQuestion
                    label="2. Are you currently on any medication?"
                    value={formData.isOnMedication}
                    onChange={(val) => handleInputChange('isOnMedication', val)}
                    details={formData.medicationDetails}
                    onDetailsChange={(val) => handleInputChange('medicationDetails', val)}
                    detailsPlaceholder="List medications..."
                  />

                  <YesNoQuestion
                    label="3. Have you had any surgeries or major injuries in the past 2 years?"
                    value={formData.hasSurgeryOrInjury}
                    onChange={(val) => handleInputChange('hasSurgeryOrInjury', val)}
                    details={formData.surgeryOrInjuryDetails}
                    onDetailsChange={(val) => handleInputChange('surgeryOrInjuryDetails', val)}
                    detailsPlaceholder="Describe..."
                  />

                  <YesNoQuestion
                    label="4. Do you experience chest pain, dizziness, or difficulty breathing during exercise?"
                    value={formData.hasChestPainOrDizziness}
                    onChange={(val) => handleInputChange('hasChestPainOrDizziness', val)}
                  />

                  <YesNoQuestion
                    label="5. Do you have any allergies?"
                    sublabel="(e.g., food, drug, insect sting)"
                    value={formData.hasAllergies}
                    onChange={(val) => handleInputChange('hasAllergies', val)}
                    details={formData.allergiesDetails}
                    onDetailsChange={(val) => handleInputChange('allergiesDetails', val)}
                    detailsPlaceholder="Specify allergies..."
                  />

                  {formData.gender === 'Female' && (
                    <YesNoQuestion
                      label="6. Are you currently pregnant?"
                      sublabel="(For female clients)"
                      value={formData.isPregnant}
                      onChange={(val) => handleInputChange('isPregnant', val)}
                    />
                  )}

                  <div>
                    <label className="text-sm font-semibold text-white mb-2">7. Emergency Contact *</label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input
                        value={formData.emergencyContactName}
                        onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                        placeholder="Contact Name"
                        className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none"
                      />
                      <input
                        value={formData.emergencyContactPhone}
                        onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                        placeholder="Contact Phone (11 digits)"
                        pattern="[0-9]{11}"
                        maxLength={11}
                        className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: LIFESTYLE INFORMATION */}
              {formStep === 3 && (
                <div className="space-y-4">
                  <YesNoQuestion
                    label="1. Do you smoke?"
                    value={formData.smokes}
                    onChange={(val) => handleInputChange('smokes', val)}
                  />

                  <YesNoQuestion
                    label="2. Do you drink alcohol?"
                    value={formData.drinksAlcohol}
                    onChange={(val) => handleInputChange('drinksAlcohol', val)}
                  />

                  <div>
                    <label className="text-sm font-semibold text-white mb-2">3. How often do you exercise? *</label>
                    <div className="space-y-2">
                      {['Never', 'Occasionally', 'Regularly'].map(freq => (
                        <label key={freq} className="flex items-center gap-2 cursor-pointer p-3 bg-white/5 rounded-lg hover:bg-white/10 transition">
                          <input
                            type="radio"
                            name="exerciseFrequency"
                            value={freq}
                            checked={formData.exerciseFrequency === freq}
                            onChange={(e) => handleInputChange('exerciseFrequency', e.target.value)}
                            className="w-4 h-4 accent-white"
                          />
                          <span className="text-white">{freq}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <Activity size={16} />
                      4. What are your fitness goals? *
                    </label>
                    <textarea
                      value={formData.fitnessGoals}
                      onChange={(e) => handleInputChange('fitnessGoals', e.target.value)}
                      placeholder="E.g., lose weight, build muscle, improve endurance, general fitness..."
                      rows={4}
                      className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: DECLARATION */}
              {formStep === 4 && (
                <div className="space-y-6">
                  <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Shield size={24} />
                      Sworn Declaration (Oath)
                    </h3>
                    <p className="text-gray-200 text-sm leading-relaxed mb-4">
                      I, <strong className="text-white">{formData.name}</strong>, hereby declare under oath that the information provided in this form is true, complete, and accurate to the best of my knowledge.
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      I understand that giving false or misleading information may put my health at risk and release 1st Impression Fitness Center from any liability arising from such misrepresentation.
                    </p>
                  </div>

                  <div className="bg-white/5 border-2 border-white/20 rounded-xl p-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.agreedToDeclaration}
                        onChange={(e) => handleInputChange('agreedToDeclaration', e.target.checked)}
                        className="mt-1 w-5 h-5 accent-white cursor-pointer"
                      />
                      <div>
                        <p className="text-white font-bold mb-1">
                          I agree to the above declaration *
                        </p>
                        <p className="text-xs text-gray-400">
                          By checking this box, you electronically sign this declaration on {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8">
                {formStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-white/10 text-white py-4 rounded-xl font-bold hover:bg-white/20 transition flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={20} />
                    Previous
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-100 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Submitting...
                    </>
                  ) : formStep === 4 ? (
                    'Complete Registration'
                  ) : (
                    <>
                      Next
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-300 text-sm">
                Already have an account?{' '}
                <button
                  onClick={() => setCurrentScreen('login')}
                  className="text-white font-bold hover:underline"
                >
                  Login
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Yes/No Question Component
const YesNoQuestion = ({ label, sublabel, value, onChange, details, onDetailsChange, detailsPlaceholder = 'Please specify...' }) => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <label className="text-sm font-semibold text-white mb-2 block">
        {label}
        {sublabel && <span className="text-gray-400 font-normal ml-1">{sublabel}</span>}
      </label>
      <div className="flex gap-4 mb-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="Yes"
            checked={value === 'Yes'}
            onChange={(e) => onChange(e.target.value)}
            className="w-4 h-4 accent-white"
          />
          <span className="text-white">Yes</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="No"
            checked={value === 'No'}
            onChange={(e) => onChange(e.target.value)}
            className="w-4 h-4 accent-white"
          />
          <span className="text-white">No</span>
        </label>
      </div>
      {value === 'Yes' && onDetailsChange && (
        <input
          value={details}
          onChange={(e) => onDetailsChange(e.target.value)}
          placeholder={detailsPlaceholder}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-white/40 focus:outline-none text-sm"
        />
      )}
    </div>
  );
};

export default RegisterScreen;