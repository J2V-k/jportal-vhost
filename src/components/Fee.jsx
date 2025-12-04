import { useEffect, useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from 'react-helmet-async';
import axios from 'axios';

export default function Fee({ w }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(false);

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "N/A";
    const num = parseFloat(amount);
    if (isNaN(num)) return "N/A";

    const formatIndianNumber = (number) => {
      const numStr = Math.floor(number).toString();
      const lastThree = numStr.substring(numStr.length - 3);
      const otherNumbers = numStr.substring(0, numStr.length - 3);
      const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + (otherNumbers ? "," : "") + lastThree;
      return formatted;
    };

    const formattedNumber = formatIndianNumber(num);
    const decimalPart = num % 1;
    if (decimalPart > 0) {
      return `₹${formattedNumber}.${decimalPart.toFixed(2).substring(2)}`;
    }
    return `₹${formattedNumber}`;
  };

  const formatNumber = (number) => {
    if (number === null || number === undefined) return "N/A";
    const num = parseFloat(number);
    if (isNaN(num)) return "N/A";

    const numStr = Math.floor(num).toString();
    const lastThree = numStr.substring(numStr.length - 3);
    const otherNumbers = numStr.substring(0, numStr.length - 3);
    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + (otherNumbers ? "," : "") + lastThree;

    const decimalPart = num % 1;
    if (decimalPart > 0) {
      return `${formatted}.${decimalPart.toFixed(2).substring(2)}`;
    }
    return formatted;
  };

  const downloadFeeDemandReport = async () => {
    /*
    Temporarily disabled fee demand report download implementation.
    Original implementation kept below for reference.

    if (!w || !w.session) {
      alert("Please login first");
      return;
    }

    setDownloadingReport(true);
    try {
      const headers = await w.session.get_headers();
      const payload = "aBfHqiPtIG0UM4CTEaq+5TT4ZeN3I6E7kIXshXIPF2BahaOq8MacUNKmo8k7AAmnnZIigAV1vR6uSHQH6lSn8qlEFzhwkdikjHm5Uv+d0nAPSfJfJDfMxnvZR6wukS/l3ER/vKREvva45Esi76ms/g==";
      const response = await axios.post(
        'https://webportal.jiit.ac.in:6011/StudentPortalAPI/feedemandreportcontroller/generatereportforpdf',
        payload,
        {
          headers: {
            ...headers,
            'Content-Type': 'text/plain',
            'Accept': 'application/pdf, application/json, text/plain',
          },
          responseType: 'blob',
          timeout: 30000
        }
      );

      const blob = response.data;

      if (blob.size === 0) {
        throw new Error('Received empty response');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'FeeDemandReport.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('Fee demand report downloaded successfully!');

    } catch (error) {
      console.error('Error downloading fee demand report:', error);

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        alert(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('The encrypted key has changed. Please ask the administrator for the updated key.');
      } else {
        alert(`Request error: ${error.message}`);
      }
    } finally {
      setDownloadingReport(false);
    }
    */

  // No-op stub while feature is disabled
  const noop = async () => {};
  await noop();
  };

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        if (!w || typeof w.get_fee_summary !== "function") {
          throw new Error("Fee API not available on portal instance");
        }
        const [feeResult, finesResult] = await Promise.all([
          w.get_fee_summary(),
          w.get_fines_msc_charges().catch((err) => {
            if (err.message?.includes("NO APPROVED REQUEST FOUND")) {
              return [];
            }
            throw err;
          }),
        ]);
        setData(feeResult);
        setFines(Array.isArray(finesResult) ? finesResult : []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [w]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px] px-4 md:px-6 lg:px-8">
      <div className="text-gray-400 dark:text-gray-600">Loading...</div>
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center min-h-[200px] px-4 md:px-6 lg:px-8">
      <div className="text-red-400 dark:text-red-600">Error: {error.message}</div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Fee Details - JP_Portal | JIIT Student Portal</title>
        <meta name="description" content="View your fee summary, payment history, outstanding dues, and download fee demand reports at Jaypee Institute of Information Technology (JIIT)." />
        <meta property="og:title" content="Fee Details - JP_Portal | Unofficial JIIT Student Portal" />
        <meta property="og:description" content="View your fee summary, payment history, outstanding dues, and download fee demand reports at Jaypee Institute of Information Technology (JIIT)." />
        <meta property="og:url" content="https://jportal2-0.vercel.app/fee" />
        <link rel="canonical" href="https://jportal2-0.vercel.app/fee" />
      </Helmet>
      <div className="max-w-7xl mx-auto space-y-4 pb-20 md:pb-6 px-4 md:px-6 lg:px-8">
      <div className="flex items-center justify-start mb-2 md:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-800 to-gray-700 dark:from-gray-200 dark:to-gray-300 hover:from-gray-700 hover:to-gray-600 dark:hover:from-gray-300 dark:hover:to-gray-400 text-white dark:text-black rounded-lg border border-gray-600 dark:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {data && (data.response || data.feeHeads || data.studentInfo) ? (() => {
        const feeData = data.response || data;
        const totalPaid = feeData.feeHeads?.reduce((s, f) => s + (Number(f.receiveamount) || 0), 0) || 0;
        const totalDue = feeData.feeHeads?.reduce((s, f) => s + (Number(f.dueamount) || 0), 0) || 0;
        const totalFines = fines.reduce((sum, fine) => {
          return sum + (parseFloat(fine.charge) || parseFloat(fine.feeamounttobepaid) || 0);
        }, 0);

        return (
          <div className="space-y-6">
            <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
              <div className="lg:col-span-4 space-y-4">
                {feeData.studentInfo && feeData.studentInfo.length > 0 && (
                  <div className="bg-[#0B0B0D] dark:bg-white rounded-lg p-4 border border-gray-600 dark:border-gray-300 shadow-lg">
                    <h4 className="text-lg font-semibold text-gray-200 dark:text-gray-800 mb-3">{feeData.studentInfo[0].name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400 dark:text-gray-600">Enrollment:</span>
                        <span className="text-gray-200 dark:text-gray-800 font-medium">{feeData.studentInfo[0].enrollmentno}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 dark:text-gray-600">Program:</span>
                        <span className="text-gray-200 dark:text-gray-800 font-medium">{feeData.studentInfo[0].programdesc}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 dark:text-gray-600">Branch:</span>
                        <span className="text-gray-200 dark:text-gray-800 font-medium">{feeData.studentInfo[0].branchdesc}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 dark:text-gray-600">Year:</span>
                        <span className="text-gray-200 dark:text-gray-800 font-medium">{feeData.studentInfo[0].academicyear}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 dark:text-gray-600">Semester:</span>
                        <span className="text-gray-200 dark:text-gray-800 font-medium">{feeData.studentInfo[0].stynumber}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-600 dark:border-gray-300">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 dark:text-gray-600">Quota:</span>
                          <span className="text-gray-200 dark:text-gray-800 font-semibold bg-gray-700 dark:bg-gray-200 px-2 py-1 rounded-full text-xs">{feeData.studentInfo[0].quotacode}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {feeData.feeHeads && feeData.feeHeads.length > 0 && (
                  <div className="bg-[#0B0B0D] dark:bg-white rounded-lg p-4 border border-gray-600 dark:border-gray-300 shadow-lg">
                    <h3 className="text-sm font-semibold text-gray-200 dark:text-gray-800 mb-3 uppercase tracking-wide">Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-green-400 dark:text-green-700 font-medium">Paid</span>
                        <span className="text-sm font-bold text-green-400 dark:text-green-700">₹{formatNumber(totalPaid)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-red-400 dark:text-red-700 font-medium">Due</span>
                        <span className="text-sm font-bold text-red-400 dark:text-red-700">₹{formatNumber(totalDue)}</span>
                      </div>
                      {totalFines > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-orange-400 dark:text-orange-700 font-medium">Fines</span>
                          <span className="text-sm font-bold text-orange-400 dark:text-orange-700">₹{formatNumber(totalFines)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* <div className="bg-[#0B0B0D] dark:bg-white rounded-lg p-4 border border-gray-600 dark:border-gray-300 shadow-lg">
                  <button
                    onClick={downloadFeeDemandReport}
                    disabled={downloadingReport}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0B0B0D] dark:bg-gray-50 text-white dark:text-black border border-gray-600 dark:border-gray-300 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingReport ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-b-2 dark:border-black"></div>
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        <span>Download Fee Demand Report</span>
                      </>
                    )}
                  </button>
                </div> */}
              </div>

              <div className="lg:col-span-8 space-y-4">
                {fines.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-200 dark:text-gray-800">Pending Fines</h3>
                    <div className="grid gap-3">
                      {fines.map((fine, index) => (
                        <div
                          key={index}
                          className="bg-[#0B0B0D] dark:bg-white rounded-lg p-4 shadow-md border border-orange-500/20"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-200 dark:text-gray-800 truncate">
                                {fine.servicename || "Miscellaneous Charge"}
                              </h4>
                              <p className="text-xs text-gray-400 dark:text-gray-600 truncate">
                                {fine.remarksbyauthority || "No remarks"}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                {formatCurrency(fine.charge || fine.feeamounttobepaid)}
                              </span>
                              {fine.servicecode && (
                                <span className="text-xs text-gray-400 dark:text-gray-600 bg-gray-800/50 dark:bg-gray-100/50 px-2 py-1 rounded">
                                  {fine.servicecode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {feeData.feeHeads && feeData.feeHeads.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-200 dark:text-gray-800">Fee Details</h3>
                    <div className="grid gap-4">
                      {feeData.feeHeads.map((fee, index) => (
                        <div key={index} className="bg-[#0B0B0D] dark:bg-white rounded-lg p-4 border border-gray-600 dark:border-gray-300 shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="text-lg font-bold text-gray-200 dark:text-gray-800">
                                Semester {fee.stynumber}
                              </h4>
                              <p className="text-xs text-gray-400 dark:text-gray-600">{fee.academicyear}</p>
                            </div>
                            {fee.dueamount > 0 && (
                              <div className="bg-red-500/10 border border-red-500/20 rounded-full px-2 py-1">
                                <span className="text-red-400 dark:text-red-500 text-xs font-medium">Due</span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="text-center p-2 bg-gray-800/50 dark:bg-gray-100/50 rounded">
                              <div className="text-xs text-gray-400 dark:text-gray-600 font-medium">Fee</div>
                              <div className="text-sm font-bold text-gray-200 dark:text-gray-800">₹{formatNumber(fee.feeamount)}</div>
                            </div>
                            <div className="text-center p-2 bg-green-500/10 dark:bg-green-100/50 rounded">
                              <div className="text-xs text-green-400 dark:text-green-700 font-medium">Paid</div>
                              <div className="text-sm font-bold text-green-400 dark:text-green-700">₹{formatNumber(fee.receiveamount)}</div>
                            </div>
                            <div className="text-center p-2 bg-red-500/10 dark:bg-red-100/50 rounded">
                              <div className="text-xs text-red-400 dark:text-red-700 font-medium">Due</div>
                              <div className={`text-sm font-bold ${fee.dueamount > 0 ? 'text-red-400 dark:text-red-700' : 'text-gray-200 dark:text-gray-800'}`}>
                                ₹{formatNumber(fee.dueamount)}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400 dark:text-gray-600">Reg. Date</span>
                              <span className="text-gray-200 dark:text-gray-800 font-medium">{new Date(fee.regallowdate).toLocaleDateString()}</span>
                            </div>
                            {fee.transferinamount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-400 dark:text-gray-600">Transfer In</span>
                                <span className="text-blue-400 dark:text-blue-600 font-medium">₹{formatNumber(fee.transferinamount)}</span>
                              </div>
                            )}
                            {fee.waiveramount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-400 dark:text-gray-600">Waiver</span>
                                <span className="text-purple-400 dark:text-purple-600 font-medium">₹{formatNumber(fee.waiveramount)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:hidden space-y-4">
              {feeData.studentInfo && feeData.studentInfo.length > 0 && (
                <div className="bg-[#0B0B0D] dark:bg-white rounded-lg p-4 border border-gray-600 dark:border-gray-300 shadow-lg">
                  <h4 className="text-base font-semibold text-gray-200 dark:text-gray-800 mb-3">{feeData.studentInfo[0].name}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400 dark:text-gray-600 text-xs">Enrollment</span>
                      <p className="text-gray-200 dark:text-gray-800 font-medium">{feeData.studentInfo[0].enrollmentno}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 dark:text-gray-600 text-xs">Program</span>
                      <p className="text-gray-200 dark:text-gray-800 font-medium">{feeData.studentInfo[0].programdesc}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 dark:text-gray-600 text-xs">Branch</span>
                      <p className="text-gray-200 dark:text-gray-800 font-medium">{feeData.studentInfo[0].branchdesc}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 dark:text-gray-600 text-xs">Year</span>
                      <p className="text-gray-200 dark:text-gray-800 font-medium">{feeData.studentInfo[0].academicyear}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 dark:text-gray-600 text-xs">Semester</span>
                      <p className="text-gray-200 dark:text-gray-800 font-medium">{feeData.studentInfo[0].stynumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 dark:text-gray-600 text-xs">Quota</span>
                      <p className="text-gray-200 dark:text-gray-800 font-semibold bg-gray-700 dark:bg-gray-200 px-2 py-1 rounded-full text-xs inline-block mt-1">{feeData.studentInfo[0].quotacode}</p>
                    </div>
                  </div>
                </div>
              )}

              {fines.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-gray-200 dark:text-gray-800">Pending Fines</h3>
                  <div className="space-y-3">
                    {fines.map((fine, index) => (
                      <div
                        key={index}
                        className="bg-[#0B0B0D] dark:bg-white rounded-lg p-4 shadow-md border border-orange-500/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-200 dark:text-gray-800 truncate">
                              {fine.servicename || "Miscellaneous Charge"}
                            </h4>
                            <p className="text-xs text-gray-400 dark:text-gray-600 truncate">
                              {fine.remarksbyauthority || "No remarks"}
                            </p>
                          </div>
                          <span className="text-lg font-bold text-orange-600 dark:text-orange-400 ml-2">
                            {formatCurrency(fine.charge || fine.feeamounttobepaid)}
                          </span>
                        </div>
                        {fine.servicecode && (
                          <div className="text-xs text-gray-400 dark:text-gray-600 bg-gray-800/50 dark:bg-gray-100/50 px-2 py-1 rounded inline-block">
                            {fine.servicecode}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {feeData.feeHeads && feeData.feeHeads.length > 0 && (
                <div className="bg-[#0B0B0D] dark:bg-white rounded-lg p-4 border border-gray-600 dark:border-gray-300 shadow-lg">
                  <h3 className="text-sm font-semibold text-gray-200 dark:text-gray-800 mb-3 uppercase tracking-wide">Summary</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-green-500/10 dark:bg-green-100/50 rounded">
                      <div className="text-xs text-green-400 dark:text-green-700 font-medium mb-1">Paid</div>
                      <div className="text-sm font-bold text-green-400 dark:text-green-700">₹{formatNumber(totalPaid)}</div>
                    </div>
                    <div className="text-center p-3 bg-red-500/10 dark:bg-red-100/50 rounded">
                      <div className="text-xs text-red-400 dark:text-red-700 font-medium mb-1">Due</div>
                      <div className="text-sm font-bold text-red-400 dark:text-red-700">₹{formatNumber(totalDue)}</div>
                    </div>
                    {totalFines > 0 && (
                      <div className="text-center p-3 bg-orange-500/10 dark:bg-orange-100/50 rounded">
                        <div className="text-xs text-orange-400 dark:text-orange-700 font-medium mb-1">Fines</div>
                        <div className="text-sm font-bold text-orange-400 dark:text-orange-700">₹{formatNumber(totalFines)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {feeData.feeHeads && feeData.feeHeads.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-gray-200 dark:text-gray-800">Fee Details</h3>
                  <div className="space-y-4">
                    {feeData.feeHeads.map((fee, index) => (
                      <div key={index} className="bg-[#0B0B0D] dark:bg-white rounded-lg p-4 border border-gray-600 dark:border-gray-300 shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-base font-bold text-gray-200 dark:text-gray-800">
                              Semester {fee.stynumber}
                            </h4>
                            <p className="text-xs text-gray-400 dark:text-gray-600">{fee.academicyear}</p>
                          </div>
                          {fee.dueamount > 0 && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-full px-2 py-1">
                              <span className="text-red-400 dark:text-red-500 text-xs font-medium">Due</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="text-center p-2 bg-gray-800/50 dark:bg-gray-100/50 rounded">
                            <div className="text-xs text-gray-400 dark:text-gray-600 font-medium">Fee</div>
                            <div className="text-sm font-bold text-gray-200 dark:text-gray-800">₹{formatNumber(fee.feeamount)}</div>
                          </div>
                          <div className="text-center p-2 bg-green-500/10 dark:bg-green-100/50 rounded">
                            <div className="text-xs text-green-400 dark:text-green-700 font-medium">Paid</div>
                            <div className="text-sm font-bold text-green-400 dark:text-green-700">₹{formatNumber(fee.receiveamount)}</div>
                          </div>
                          <div className="text-center p-2 bg-red-500/10 dark:bg-red-100/50 rounded">
                            <div className="text-xs text-red-400 dark:text-red-700 font-medium">Due</div>
                            <div className={`text-sm font-bold ${fee.dueamount > 0 ? 'text-red-400 dark:text-red-700' : 'text-gray-200 dark:text-gray-800'}`}>
                              ₹{formatNumber(fee.dueamount)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400 dark:text-gray-600">Reg. Date</span>
                            <span className="text-gray-200 dark:text-gray-800 font-medium">{new Date(fee.regallowdate).toLocaleDateString()}</span>
                          </div>
                          {fee.transferinamount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-400 dark:text-gray-600">Transfer In</span>
                              <span className="text-blue-400 dark:text-blue-600 font-medium">₹{formatNumber(fee.transferinamount)}</span>
                            </div>
                          )}
                          {fee.waiveramount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-400 dark:text-gray-600">Waiver</span>
                              <span className="text-purple-400 dark:text-purple-600 font-medium">₹{formatNumber(fee.waiveramount)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* <div className="mt-6">
                <button
                  onClick={downloadFeeDemandReport}
                  disabled={downloadingReport}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0B0B0D] dark:bg-gray-50 text-white dark:text-black border border-gray-600 dark:border-gray-300 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-b-2 dark:border-black"></div>
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      <span>Download Fee Demand Report</span>
                    </>
                  )}
                </button>
              </div> */}
            </div>
          </div>
        );
      })() : (
        <div className="flex items-center justify-center min-h-[200px] px-4 md:px-6 lg:px-8">
          <div className="text-gray-400 dark:text-gray-600">No fee data available</div>
        </div>
      )}

    </div>
    </>
  );
}
