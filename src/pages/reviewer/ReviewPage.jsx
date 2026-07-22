import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { reviewerNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { studentService } from '@/firebase/services/studentService';
import { reviewService } from '@/firebase/services/reviewService';
import { notificationService } from '@/firebase/services/notificationService';
import { Loader2, ClipboardList, CheckCircle, Save, AlertCircle, ArrowLeft, UserCheck, Folder, ShieldCheck } from 'lucide-react';

const ReviewPage = ({ reviewType }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedStudent = searchParams.get('student');
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    studentId: preselectedStudent || '',
    presentation: 0,
    technical: 0,
    qa: 0,
    remarks: '',
    status: 'Draft'
  });

  const [scoresEntered, setScoresEntered] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchData(currentUser.uid);
    }
  }, [currentUser, reviewType]);

  const fetchData = async (uid) => {
    try {
      setLoading(true);
      setError(null);
      
      const [allStudents, allReviews] = await Promise.all([
        studentService.getByReviewerId(uid),
        reviewService.getByReviewerId(uid)
      ]);
      
      setStudents(allStudents);

      if (preselectedStudent) {
        const target = allStudents.find(s => 
          s.id === preselectedStudent || 
          s.uid === preselectedStudent || 
          s.rollNumber === preselectedStudent || 
          s.rollNo === preselectedStudent
        );
        const resolvedId = target ? (target.id || target.uid) : preselectedStudent;
        setFormData(prev => ({ ...prev, studentId: resolvedId }));
        loadDraft(resolvedId, allReviews);
      }
      
    } catch (err) {
      console.error("Error fetching review data:", err);
      setError("Failed to fetch evaluation data.");
    } finally {
      setLoading(false);
    }
  };

  const loadDraft = async (studentId, allReviews = null) => {
    try {
      let reviews = allReviews;
      if (!reviews) {
        reviews = await reviewService.getByReviewerId(currentUser.uid);
      }
      
      const existing = reviews.find(r => r.studentId === studentId && r.reviewType === reviewType);
      if (existing) {
        const pres = existing.scores?.presentation || 0;
        const tech = existing.scores?.technical || 0;
        const qaScore = existing.scores?.qa || 0;
        setFormData({
          id: existing.id,
          studentId: existing.studentId,
          presentation: pres,
          technical: tech,
          qa: qaScore,
          remarks: existing.remarks || '',
          status: existing.status || 'Draft'
        });
        setScoresEntered(pres > 0 || tech > 0 || qaScore > 0 || existing.status === 'Final');
      } else {
        setFormData({
          id: null,
          studentId: studentId,
          presentation: 0,
          technical: 0,
          qa: 0,
          remarks: '',
          status: 'Draft'
        });
        setScoresEntered(false);
      }
    } catch (err) {
      console.error("Failed to load draft:", err);
    }
  };

  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    setFormData(prev => ({ ...prev, studentId }));
    setSuccess(null);
    setError(null);
    navigate(`?student=${studentId}`, { replace: true });
    loadDraft(studentId);
  };

  const handleScoreChange = (field, value) => {
    const num = Math.min(Math.max(parseInt(value) || 0, 0), 100);
    setFormData(prev => ({ ...prev, [field]: num }));
    setScoresEntered(true);
  };

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.studentId) {
      setError("Please select an assigned student to begin evaluation.");
      return;
    }

    if (formData.status === 'Final' && actionType !== 'Edit') {
      setError("This review has already been submitted and finalized.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const calculatedScore = Math.round((formData.presentation + formData.technical + formData.qa) / 3);
      const payload = {
        reviewerId: currentUser.uid,
        studentId: formData.studentId,
        reviewType: reviewType,
        scores: {
          presentation: formData.presentation,
          technical: formData.technical,
          qa: formData.qa
        },
        totalScore: calculatedScore,
        remarks: formData.remarks,
        status: actionType === 'Final' ? 'Final' : 'Draft',
        updatedAt: new Date().toISOString()
      };

      if (formData.id) {
        await reviewService.update(formData.id, payload);
      } else {
        payload.createdAt = new Date().toISOString();
        const newRef = await reviewService.create(payload);
        setFormData(prev => ({ ...prev, id: newRef.id }));
      }

      if (actionType === 'Final') {
        const nextStage = reviewType === 'Review 1' ? 'Review 2' : (reviewType === 'Review 2' ? 'Review 3' : 'Completed');
        await studentService.update(formData.studentId, { reviewStage: nextStage });
        
        await notificationService.create({
          userId: formData.studentId,
          title: `${reviewType} Results Published`,
          message: `Your reviewer has published your evaluation results for ${reviewType}. Aggregate score: ${calculatedScore}/100.`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      setFormData(prev => ({ ...prev, status: actionType === 'Final' ? 'Final' : 'Draft' }));
      setSuccess(`Evaluation successfully ${actionType === 'Final' ? 'submitted and finalized' : 'saved as draft'}.`);

      if (actionType === 'Final') {
        setTimeout(() => {
          navigate('/reviewer/students');
        }, 1500);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to save evaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={reviewerNavigation} title={`KL CSE Capstone Portal - ${reviewType}`}>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const selectedStudentObj = students.find(s => 
    s.id === formData.studentId || 
    s.uid === formData.studentId ||
    s.rollNumber === formData.studentId ||
    s.rollNo === formData.studentId
  );

  const aggregateScoreDisplay = scoresEntered 
    ? Math.round((formData.presentation + formData.technical + formData.qa) / 3) 
    : "Not Calculated";

  const isFinalized = formData.status === 'Final';

  return (
    <DashboardLayout navigationItems={reviewerNavigation} title={`KL CSE Capstone Portal - ${reviewType}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/reviewer/students')} className="text-gray-500 hover:text-gray-700 p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary-600" /> {reviewType} Evaluation
            </h1>
            <p className="text-sm text-gray-500 mt-1">Rubric-based evaluation workflow for assigned students.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2 border border-green-200">
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        <Card>
          <div className="mb-6 pb-6 border-b border-gray-100">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Select Student</label>
            <select
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-3 bg-gray-50 border transition-colors"
              value={formData.studentId}
              onChange={handleStudentChange}
              disabled={isFinalized}
            >
              <option value="">-- Select Assigned Student --</option>
              {students.map(s => {
                const sId = s.id || s.uid;
                const roll = s.rollNumber || s.rollNo || 'N/A';
                return (
                  <option key={sId} value={sId}>
                    {s.name} ({roll}) - {s.projectTitle || 'No Project'}
                  </option>
                );
              })}
            </select>

            {/* Issue 9: Summary Card */}
            {selectedStudentObj ? (
              <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">Evaluation Profile</span>
                    <h3 className="text-xl font-bold text-gray-900 mt-0.5">{selectedStudentObj.name}</h3>
                    <p className="text-sm text-gray-500 font-medium">Roll No: {selectedStudentObj.rollNumber || selectedStudentObj.rollNo || 'N/A'}</p>
                  </div>
                  <Badge variant={isFinalized ? 'success' : 'warning'}>
                    {isFinalized ? 'Finalized' : 'Draft Mode'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-gray-400 font-medium block">Team / Section</span>
                    <span className="font-semibold text-gray-800">{selectedStudentObj.teamName || selectedStudentObj.section || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Project Title</span>
                    <span className="font-semibold text-gray-800 truncate block" title={selectedStudentObj.projectTitle}>{selectedStudentObj.projectTitle || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Assigned Guide</span>
                    <span className="font-semibold text-gray-800">{selectedStudentObj.guideName || 'Assigned Guide'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Review Stage</span>
                    <span className="font-semibold text-primary-700">{reviewType}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-6 bg-amber-50 border border-amber-200 rounded-lg text-center text-amber-800 font-medium text-sm">
                Please select an assigned student to begin evaluation.
              </div>
            )}
          </div>

          {/* Issue 2: Hide or Disable Form Inputs when no student selected */}
          {!formData.studentId ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              Form inputs and scoring criteria will be enabled once a student is selected.
            </div>
          ) : (
            <form className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Evaluation Criteria</h3>
                
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-100 rounded-lg bg-white shadow-sm">
                    <div>
                      <h4 className="font-semibold text-gray-900">Presentation & Communication</h4>
                      <p className="text-xs text-gray-500 mt-1">Clarity, structure, slide quality, and delivery.</p>
                    </div>
                    <div className="mt-2 md:mt-0 flex items-center gap-2">
                      <Input 
                        type="number" 
                        min="0" max="100" 
                        value={formData.presentation}
                        onChange={(e) => handleScoreChange('presentation', e.target.value)}
                        className="w-24 text-center font-bold text-lg"
                        disabled={isFinalized}
                      />
                      <span className="text-sm text-gray-500 font-medium">/ 100</span>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-100 rounded-lg bg-white shadow-sm">
                    <div>
                      <h4 className="font-semibold text-gray-900">Technical Competence</h4>
                      <p className="text-xs text-gray-500 mt-1">Architecture, implementation logic, tech stack, and code quality.</p>
                    </div>
                    <div className="mt-2 md:mt-0 flex items-center gap-2">
                      <Input 
                        type="number" 
                        min="0" max="100" 
                        value={formData.technical}
                        onChange={(e) => handleScoreChange('technical', e.target.value)}
                        className="w-24 text-center font-bold text-lg"
                        disabled={isFinalized}
                      />
                      <span className="text-sm text-gray-500 font-medium">/ 100</span>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-100 rounded-lg bg-white shadow-sm">
                    <div>
                      <h4 className="font-semibold text-gray-900">Q&A Handling</h4>
                      <p className="text-xs text-gray-500 mt-1">Defense of design choices and responses to reviewer queries.</p>
                    </div>
                    <div className="mt-2 md:mt-0 flex items-center gap-2">
                      <Input 
                        type="number" 
                        min="0" max="100" 
                        value={formData.qa}
                        onChange={(e) => handleScoreChange('qa', e.target.value)}
                        className="w-24 text-center font-bold text-lg"
                        disabled={isFinalized}
                      />
                      <span className="text-sm text-gray-500 font-medium">/ 100</span>
                    </div>
                  </div>
                </div>

                {/* Issue 3: Aggregate Score Display */}
                <div className="mt-6 flex justify-end">
                  <div className="bg-gray-900 text-white px-6 py-3 rounded-xl flex items-center gap-4 shadow-md">
                    <span className="text-sm font-medium text-gray-300 uppercase tracking-wide">Aggregate Score</span>
                    <span className="text-2xl font-bold">{aggregateScoreDisplay}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Reviewer Remarks</h3>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-3 border resize-y"
                  placeholder="Provide constructive feedback, key findings, and areas for improvement..."
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({...prev, remarks: e.target.value}))}
                  disabled={isFinalized}
                ></textarea>
              </div>

              {/* Issue 4: Submit Evaluation Buttons */}
              <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
                {isFinalized ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setFormData(prev => ({ ...prev, status: 'Draft' }))}
                    className="flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" /> Edit Submitted Evaluation
                  </Button>
                ) : (
                  <>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={(e) => handleSubmit(e, 'Draft')}
                      disabled={submitting || !formData.studentId}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> {submitting ? 'Saving...' : 'Save as Draft'}
                    </Button>
                    <Button 
                      type="button" 
                      onClick={(e) => {
                        if (window.confirm(`Are you sure you want to finalize and submit ${reviewType} evaluation?`)) {
                          handleSubmit(e, 'Final');
                        }
                      }}
                      disabled={submitting || !formData.studentId}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Final Submit'}
                    </Button>
                  </>
                )}
              </div>
            </form>
          )}
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default ReviewPage;
