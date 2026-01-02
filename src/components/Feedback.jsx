import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, Shuffle, X } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Helmet } from 'react-helmet-async';

const API = "https://webportal.jiit.ac.in:6011/StudentPortalAPI";

function generate_date_seq(date = null) {
  if (date === null) {
    date = new Date();
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(2);
  const weekday = String(date.getDay());
  return day[0] + month[0] + year[0] + weekday + day[1] + month[1] + year[1];
}

function base64Encode(data) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(data)));
}

var IV = new TextEncoder().encode("dcek9wb8frty1pnm");

async function generate_key(date = null) {
  const dateSeq = generate_date_seq(date);
  const keyData = new TextEncoder().encode("qa8y" + dateSeq + "ty1pn");
  return window.crypto.subtle.importKey("raw", keyData, { name: "AES-CBC" }, false, ["encrypt", "decrypt"]);
}

async function encrypt(data) {
  const key = await generate_key();
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-CBC", iv: IV }, key, data);
  return new Uint8Array(encrypted);
}

async function serialize_payload(payload) {
  const raw = new TextEncoder().encode(JSON.stringify(payload));
  const pbytes = await encrypt(raw);
  return base64Encode(pbytes);
}

const Feedback = ({ w }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState('');
  const [eventData, setEventData] = useState(null);
  const [gridData, setGridData] = useState([]);
  const [questionsData, setQuestionsData] = useState({});
  const [ratings, setRatings] = useState({});
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [randomized, setRandomized] = useState(false);

  useEffect(() => {
    fetchFeedbackData();
  }, []);

  const fetchFeedbackData = async () => {
    if (!w || !w.session) {
      setMessage('You must be logged in to view feedback.');
      setFetching(false);
      return;
    }

    try {

      const SEMESTER_ENDPOINT = "/feedbackformcontroller/getFeedbackEvent";
      const payload = {
        instituteid: w.session.instituteid
      };
      const resp = await w.__hit("POST", API + SEMESTER_ENDPOINT, { json: payload, authenticated: true });
      let semesters = resp["response"]["eventList"];
      if (!semesters || semesters.length === 0) {
        setMessage('No feedback available now. Please come back later.');
        setFetching(false);
        return;
      }
      let latest_semester = semesters[semesters.length - 1];
      setEventData(latest_semester);


      const GRID_ENDPOINT = "/feedbackformcontroller/getGriddataForFeedback";
      const grid_payload = await serialize_payload({
        instituteid: w.session.instituteid,
        studentid: w.session.memberid,
        eventid: latest_semester.eventid
      });
      const grid_resp = await w.__hit("POST", API + GRID_ENDPOINT, { json: grid_payload, authenticated: true });
      let grid_data = grid_resp["response"]["gridData"];
      if (!grid_data || grid_data.length === 0) {
        throw new Error('No feedback data found');
      }
      setGridData(grid_data);


      const GET_QUESTIONS_ENDPOINT = "/feedbackformcontroller/getIemQuestion";
      const questionsMap = {};

      for (let data of grid_data) {
        const question_feedback_payload = {
          instituteid: w.session.instituteid,
          eventid: latest_semester.eventid,
          eventdescription: latest_semester.eventdescription,
          facultyid: data.employeeid,
          facultyname: data.employeename,
          registrationid: data.registrationid,
          studentid: data.studentid,
          subjectcode: data.subjectcode,
          subjectcomponentcode: data.subjectcomponentcode,
          subjectcomponentid: data.subjectcomponentid,
          subjectdescription: data.subjectdesc,
          subjectid: data.subjectid
        };

        try {
          const questions_resp = await w.__hit("POST", API + GET_QUESTIONS_ENDPOINT, {
            json: question_feedback_payload,
            authenticated: true
          });

          if (questions_resp?.response?.questionList) {
            const key = `${data.subjectid}-${data.employeeid}`;
            questionsMap[key] = {
              subject: data,
              questions: questions_resp.response.questionList,
              ratings: questions_resp.response.ratingList
            };
          }
        } catch (error) {
          console.error('Failed to get questions for', question_feedback_payload, error);
        }
      }

      setQuestionsData(questionsMap);


      const defaultRatings = {};
      Object.entries(questionsMap).forEach(([key, data]) => {
        const { subject, questions, ratings: ratingOptions } = data;
        const excellentRating = ratingOptions.find(r => r.ratingdesc.toLowerCase() === 'excellent');
        if (excellentRating) {
          questions.forEach(q => {
            const ratingKey = `${subject.subjectid}-${subject.employeeid}-${q.questionid}`;
            defaultRatings[ratingKey] = excellentRating.rating;
          });
        }
      });
      setRatings(defaultRatings);

    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Failed to load feedback data.');
    } finally {
      setFetching(false);
    }
  };

  const handleRatingChange = (subjectId, facultyId, questionId, rating) => {
    const key = `${subjectId}-${facultyId}-${questionId}`;
    setRatings(prev => ({
      ...prev,
      [key]: rating
    }));
    setRandomized(false);
  };

  const handleBulkRatingChange = (subjectId, facultyId, rating) => {
    const subjectKey = `${subjectId}-${facultyId}`;
    const data = questionsData[subjectKey];
    if (data) {
      const newRatings = { ...ratings };
      data.questions.forEach(question => {
        const key = `${subjectId}-${facultyId}-${question.questionid}`;
        newRatings[key] = rating;
      });
      setRatings(newRatings);
    }
    setRandomized(false);
  };

  const handleGlobalRatingChange = (rating) => {
    const newRatings = { ...ratings };
    Object.entries(questionsData).forEach(([key, data]) => {
      const { subject, questions } = data;
      questions.forEach(question => {
        const ratingKey = `${subject.subjectid}-${subject.employeeid}-${question.questionid}`;
        newRatings[ratingKey] = rating;
      });
    });
    setRatings(newRatings);
    setRandomized(false);
  };

  const toggleSubjectExpansion = (subjectId, facultyId) => {
    const key = `${subjectId}-${facultyId}`;
    setExpandedSubjects(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getBulkRating = (subjectId, facultyId) => {
    const subjectKey = `${subjectId}-${facultyId}`;
    const data = questionsData[subjectKey];
    if (!data) return null;

    const firstRating = ratings[`${subjectId}-${facultyId}-${data.questions[0].questionid}`];
    const allSame = data.questions.every(question =>
      ratings[`${subjectId}-${facultyId}-${question.questionid}`] === firstRating
    );

    return allSame ? firstRating : null;
  };

  const getGlobalRating = () => {
    if (Object.keys(questionsData).length === 0) return null;

    const firstSubject = Object.values(questionsData)[0];
    const firstQuestion = firstSubject.questions[0];
    const firstRating = ratings[`${firstSubject.subject.subjectid}-${firstSubject.subject.employeeid}-${firstQuestion.questionid}`];


    const allSame = Object.entries(questionsData).every(([key, data]) => {
      const { subject, questions } = data;
      return questions.every(question =>
        ratings[`${subject.subjectid}-${subject.employeeid}-${question.questionid}`] === firstRating
      );
    });

    return allSame ? firstRating : null;
  };

  const randomizeRatings = () => {
    const newRatings = { ...ratings };
    Object.values(questionsData).forEach((data) => {
      const { subject, questions, ratings: ratingOptions } = data;
      questions.forEach((q) => {
        const key = `${subject.subjectid}-${subject.employeeid}-${q.questionid}`;
        const options = (ratingOptions || []).filter(r => r.questionid === q.questionid);
        if (options.length > 0) {
          const choice = options[Math.floor(Math.random() * options.length)];
          newRatings[key] = choice.rating;
        }
      });
    });
    setRatings(newRatings);
    setRandomized(true);
  };

  const handleFeedbackSubmit = async () => {
    if (!w || !w.session || !eventData) {
      setMessage('Session expired. Please login again.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const SAVE_ENDPOINT = "/feedbackformcontroller/savedatalist";

      for (let [key, data] of Object.entries(questionsData)) {
        const { subject, questions } = data;
        const questions_to_submit = questions.map(q => {
          const ratingKey = `${subject.subjectid}-${subject.employeeid}-${q.questionid}`;
          const selectedRating = ratings[ratingKey];

          if (!selectedRating) {
            throw new Error(`Please select rating for all questions in ${subject.subjectdesc}`);
          }

          return {
            ...q,
            rating: selectedRating
          };
        });

        const save_data_payload = await serialize_payload({
          instituteid: w.session.instituteid,
          studentid: w.session.memberid,
          eventid: eventData.eventid,
          subjectid: subject.subjectid,
          facultyid: subject.employeeid,
          registrationid: subject.registrationid,
          questionid: questions_to_submit,
          facultycomments: null,
          coursecomments: null
        });

        await w.__hit("POST", API + SAVE_ENDPOINT, { json: save_data_payload, authenticated: true });
      }

      setMessage('Feedback submitted successfully!');
      setFeedbackSubmitted(true);
      setDialogType('success');
      setDialogOpen(true);

    } catch (err) {
      console.error('Submit error:', err);
      console.log('Error message:', err.message);
      console.log('Error status:', err.status);
      console.log('Error responseStatus:', err.responseStatus);
      console.log('Error errors:', err.errors);

      const isAlreadySubmitted =
        (err.message && (
          err.message.includes('Feedback already Submit!') ||
          err.message.includes('Feedback already Sumbit!') ||
          err.message.includes('"responseStatus": "Failure"') ||
          err.message.includes('responseStatus') ||
          err.message.includes('errors')
        )) ||
        (err.status === 417) ||
        (err.responseStatus === 'Failure' && err.errors && (
          err.errors.includes('Feedback already Submit!') ||
          err.errors.includes('Feedback already Sumbit!')
        )) ||
        (err.responseStatus === 'Failure');

      if (isAlreadySubmitted) {
        setFeedbackSubmitted(true);
        setMessage('Your feedback has already been submitted for this semester.');
        setDialogType('already_submitted');
        setDialogOpen(true);
      } else {
        setMessage(err.message || 'Failed to submit feedback.');
        setDialogType('error');
        setDialogOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Feedback - JP Portal</title>
        <meta name="description" content="Submit feedback and suggestions for JP Portal, the unofficial student portal for Jaypee Institute of Information Technology (JIIT)." />
        <meta name="keywords" content="feedback, suggestions, JIIT feedback, JP Portal, JIIT, student portal, jportal, jpportal, jp_portal, jp portal" />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground p-4 pb-24 md:p-8 md:pb-8 lg:px-12 xl:px-16">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full hover:bg-accent"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold">Faculty Feedback</h1>
          </div>

          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading feedback form...</span>
            </div>
          ) : message && !eventData && Object.keys(questionsData).length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-auto">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-foreground" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Feedback Unavailable</h2>
                <p className="text-muted-foreground mb-6">{message}</p>
                <div className="flex justify-center">
                  <Button
                    onClick={() => navigate(-1)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                  </Button>
                </div>
              </div>
            </div>
          ) : feedbackSubmitted ? (

            <div className="text-center py-12">
              <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-auto">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Feedback Already Submitted
                </h2>
                <p className="text-muted-foreground mb-4">
                  You have already submitted feedback for this semester.
                </p>
                <Button
                  onClick={() => navigate(-1)}
                  className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </Button>
              </div>
            </div>
          ) : (
            <>
              {eventData && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      {eventData.eventdescription}
                    </h2>
                  </div>
                </div>
              )}


              {Object.keys(questionsData).length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Quick Global Rating
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Apply to all {Object.keys(questionsData).length} subject{Object.keys(questionsData).length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      <Select
                        value={getGlobalRating() || ""}
                        onValueChange={handleGlobalRatingChange}
                      >
                        <SelectTrigger className="w-full lg:w-64 bg-background text-foreground border-border">
                          <SelectValue placeholder={randomized ? "Random rating" : "Choose rating"} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(questionsData)[0]?.ratings
                            .filter(r => r.questionid === Object.values(questionsData)[0]?.questions[0]?.questionid)
                            .sort((a, b) => a.slno - b.slno)
                            .map((rating) => (
                              <SelectItem key={rating.ratingid} value={rating.rating}>
                                {rating.ratingdesc}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={randomizeRatings}
                        className="ml-2 text-foreground border-border hover:bg-accent flex items-center gap-2"
                      >
                        <Shuffle className="w-4 h-4" />
                        Randomize Fill
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {Object.entries(questionsData).map(([key, data]) => {
                  const { subject, questions, ratings: ratingOptions } = data;
                  return (
                    <div key={key} className="bg-card border border-border rounded-xl p-6 space-y-4">
                      <div className="border-b border-border pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground">
                              {subject.subjectdesc}
                            </h3>
                            <p className="text-muted-foreground text-sm mt-1">
                              Faculty: {subject.employeename}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              Code: {subject.subjectcode}
                            </p>
                          </div>
                          <div className="ml-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                              {subject.subjectcomponentcode === 'L' ? 'Lecture' : subject.subjectcomponentcode === 'P' ? 'Practical' : subject.subjectcomponentcode}
                            </span>
                          </div>
                        </div>
                      </div>


                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-foreground">
                            Quick Rating (applies to all questions)
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSubjectExpansion(subject.subjectid, subject.employeeid)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {expandedSubjects[`${subject.subjectid}-${subject.employeeid}`] ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <Select
                          value={getBulkRating(subject.subjectid, subject.employeeid) || ""}
                          onValueChange={(value) => handleBulkRatingChange(subject.subjectid, subject.employeeid, value)}
                        >
                          <SelectTrigger className="w-full bg-background text-foreground border-border">
                            <SelectValue placeholder={randomized ? "Random rating for all questions" : "Choose rating for all questions"} />
                          </SelectTrigger>
                          <SelectContent>
                            {ratingOptions
                              .filter(r => r.questionid === questions[0]?.questionid)
                              .sort((a, b) => a.slno - b.slno)
                              .map((rating) => (
                                <SelectItem key={rating.ratingid} value={rating.rating}>
                                  {rating.ratingdesc}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>


                      {expandedSubjects[`${subject.subjectid}-${subject.employeeid}`] && (
                        <div className="space-y-4 border-t border-border pt-4">
                          <Label className="text-sm font-medium text-foreground">
                            Individual Questions
                          </Label>
                          {questions.map((question) => {
                            const ratingKey = `${subject.subjectid}-${subject.employeeid}-${question.questionid}`;
                            const currentRating = ratings[ratingKey];

                            return (
                              <div key={question.questionid} className="space-y-2">
                                <Label className="text-sm font-medium text-foreground">
                                  {question.questionbody}
                                </Label>
                                <Select
                                  value={currentRating || ""}
                                  onValueChange={(value) => handleRatingChange(subject.subjectid, subject.employeeid, question.questionid, value)}
                                >
                                  <SelectTrigger className="w-full bg-background text-foreground border-border">
                                    <SelectValue placeholder={randomized ? "Random rating" : "Choose rating"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ratingOptions
                                      .filter(r => r.questionid === question.questionid)
                                      .sort((a, b) => a.slno - b.slno)
                                      .map((rating) => (
                                        <SelectItem key={rating.ratingid} value={rating.rating}>
                                          {rating.ratingdesc}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {Object.keys(questionsData).length > 0 && !feedbackSubmitted && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <Button
                    onClick={handleFeedbackSubmit}
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting Feedback...
                      </>
                    ) : (
                      'Submit All Feedback'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>


      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogType === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {dialogType === 'already_submitted' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {dialogType === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              {dialogType === 'success' && 'Feedback Submitted'}
              {dialogType === 'already_submitted' && 'Feedback Already Submitted'}
              {dialogType === 'error' && 'Submission Failed'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">{dialogType === 'success' ? 'Your feedback has been submitted.' : dialogType === 'already_submitted' ? 'You have already submitted feedback.' : 'An error occurred while submitting feedback.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {dialogType !== 'already_submitted' && (
              <p className="text-muted-foreground">{message}</p>
            )}
            {dialogType === 'already_submitted' && (
              <div className="bg-green-500/10 dark:bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-green-400 dark:text-green-600 font-medium">Feedback Already Submitted</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      You have already submitted feedback for this semester. No further action is required.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              {dialogType === 'already_submitted' ? (
                <Button
                  onClick={() => navigate(-1)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </Button>
              ) : (
                <Button
                  onClick={() => setDialogOpen(false)}
                  variant="outline"
                  className="bg-transparent text-muted-foreground border-border hover:bg-accent hover:text-foreground flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Close
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Feedback;
