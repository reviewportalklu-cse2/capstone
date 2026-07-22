import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { HelpCircle, Mail, MessageSquare, CheckCircle, Loader2 } from 'lucide-react';

const GuideHelp = () => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticket, setTicket] = useState({ subject: '', description: '' });

  const faqs = [
    { q: "How do I add a remark for a student?", a: "Navigate to the 'Review Remarks' page via the sidebar, select the 'Add Remark' button, choose your assigned student, and enter your feedback." },
    { q: "Can I evaluate students assigned to other guides?", a: "No, the system employs strict Role-Based Access Control. You can only view and evaluate students explicitly assigned to your guidance." },
    { q: "How do I schedule a meeting?", a: "Go to the 'Meetings' page and click 'Schedule Meeting'. This will automatically dispatch a notification to the selected student." },
    { q: "Why can't I see my student's repository?", a: "The repository link only becomes available once the student has formally submitted their project metadata. If it is missing, advise the student to update their profile." }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setTicket({ subject: '', description: '' });
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <DashboardLayout navigationItems={guideNavigation} title="KL CSE Capstone Portal - Help & Support">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary-600" /> Help & Support
          </h1>
          <p className="text-sm text-gray-500 mt-1">Find answers to common questions or contact the platform administrator.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card title="Frequently Asked Questions">
              <div className="space-y-4 mt-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <h4 className="font-semibold text-gray-900 text-sm flex items-start gap-2">
                      <span className="text-primary-500 font-bold">Q:</span> {faq.q}
                    </h4>
                    <p className="text-sm text-gray-600 mt-2 flex items-start gap-2 pl-6">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-primary-50 border-primary-100">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-full text-primary-600 shadow-sm">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Direct Admin Contact</h3>
                  <p className="text-sm text-gray-600 mt-1">admin@capstoneflow.edu</p>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <Card title="Raise a Support Ticket">
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {success && (
                  <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm flex items-center gap-2 mb-4">
                    <CheckCircle className="w-4 h-4" />
                    Support ticket submitted successfully!
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <Input 
                    required
                    value={ticket.subject}
                    onChange={(e) => setTicket({...ticket, subject: e.target.value})}
                    placeholder="Brief description of the issue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
                  <textarea 
                    required
                    rows={6}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-3 border"
                    value={ticket.description}
                    onChange={(e) => setTicket({...ticket, description: e.target.value})}
                    placeholder="Please provide as much detail as possible..."
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full justify-center">
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><MessageSquare className="w-4 h-4 mr-2" /> Submit Ticket</>}
                </Button>
              </form>
            </Card>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default GuideHelp;
