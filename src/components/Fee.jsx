import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Fee({ w }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        if (!w || typeof w.get_fee_summary !== "function") {
          throw new Error("Fee API not available on portal instance");
        }
        const result = await w.get_fee_summary();
        setData(result);
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
    <div className="space-y-6 pb-20 md:pb-6 px-4 md:px-6 lg:px-8">
      {/* Back Button */}
      <div className="flex items-center justify-start mb-4 md:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-700 dark:from-gray-200 dark:to-gray-300 hover:from-gray-700 hover:to-gray-600 dark:hover:from-gray-300 dark:hover:to-gray-400 text-white dark:text-black rounded-lg border border-gray-600 dark:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {data && (data.response || data.feeHeads || data.studentInfo) ? (() => {
        const feeData = data.response || data;
        return (
          <div className="space-y-8">
            {/* Student Info Card */}
            {feeData.studentInfo && feeData.studentInfo.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {feeData.studentInfo.map((info, index) => (
                    <div key={index} className="bg-[#0B0B0D] dark:bg-white rounded-lg p-6 border border-gray-600 dark:border-gray-300 shadow-lg">
                      <h4 className="text-lg font-semibold text-gray-200 dark:text-gray-800 mb-4">{info.name}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="text-gray-400 dark:text-gray-600 font-medium">Enrollment</div>
                          <div className="text-gray-200 dark:text-gray-800 font-semibold">{info.enrollmentno}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-gray-400 dark:text-gray-600 font-medium">Program</div>
                          <div className="text-gray-200 dark:text-gray-800 font-semibold">{info.programdesc}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-gray-400 dark:text-gray-600 font-medium">Branch</div>
                          <div className="text-gray-200 dark:text-gray-800 font-semibold">{info.branchdesc}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-gray-400 dark:text-gray-600 font-medium">Academic Year</div>
                          <div className="text-gray-200 dark:text-gray-800 font-semibold">{info.academicyear}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-gray-400 dark:text-gray-600 font-medium">Semester</div>
                          <div className="text-gray-200 dark:text-gray-800 font-semibold">{info.stynumber}</div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-600 dark:border-gray-300">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 dark:text-gray-600 font-medium">Quota</span>
                          <span className="text-gray-200 dark:text-gray-800 font-semibold bg-gray-700 dark:bg-gray-200 px-3 py-1 rounded-full text-xs">{info.quotacode}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fee Heads Cards */}
            {feeData.feeHeads && feeData.feeHeads.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-200 dark:text-gray-800">Fee Details</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {feeData.feeHeads.map((fee, index) => (
                    <div key={index} className="bg-[#0B0B0D] dark:bg-white rounded-xl p-6 border border-gray-600 dark:border-gray-300 shadow-lg hover:shadow-xl transition-all duration-200">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xl font-bold text-gray-200 dark:text-gray-800">
                            Semester {fee.stynumber}
                          </h4>
                          <p className="text-sm text-gray-400 dark:text-gray-600">{fee.academicyear}</p>
                        </div>
                        {fee.dueamount > 0 && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1">
                            <span className="text-red-400 dark:text-red-500 text-xs font-medium">Due</span>
                          </div>
                        )}
                      </div>

                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-3 bg-gray-800/50 dark:bg-gray-100/50 rounded-lg">
                          <div className="text-xs text-gray-400 dark:text-gray-600 font-medium mb-1">Total Fee</div>
                          <div className="text-lg font-bold text-gray-200 dark:text-gray-800">₹{fee.feeamount.toLocaleString()}</div>
                        </div>
                        <div className="text-center p-3 bg-green-500/10 dark:bg-green-100/50 rounded-lg">
                          <div className="text-xs text-green-400 dark:text-green-700 font-medium mb-1">Paid</div>
                          <div className="text-lg font-bold text-green-400 dark:text-green-700">₹{fee.receiveamount.toLocaleString()}</div>
                        </div>
                        <div className="text-center p-3 bg-red-500/10 dark:bg-red-100/50 rounded-lg">
                          <div className="text-xs text-red-400 dark:text-red-700 font-medium mb-1">Due</div>
                          <div className={`text-lg font-bold ${fee.dueamount > 0 ? 'text-red-400 dark:text-red-700' : 'text-gray-200 dark:text-gray-800'}`}>
                            ₹{fee.dueamount.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 dark:text-gray-600">Registration Date</span>
                          <span className="text-gray-200 dark:text-gray-800 font-medium">{new Date(fee.regallowdate).toLocaleDateString()}</span>
                        </div>

                        {fee.transferinamount > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 dark:text-gray-600">Transfer In</span>
                            <span className="text-blue-400 dark:text-blue-600 font-medium">₹{fee.transferinamount.toLocaleString()}</span>
                          </div>
                        )}

                        {fee.waiveramount > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 dark:text-gray-600">Waiver</span>
                            <span className="text-purple-400 dark:text-purple-600 font-medium">₹{fee.waiveramount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Outstanding Payment Alert */}
                      {fee.dueamount > 0 && (
                        <div className="mt-4 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 rounded-lg p-4">
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-red-400 dark:text-red-500">⚠️</span>
                            <span className="text-red-400 dark:text-red-600 font-semibold text-sm">Outstanding Payment Required</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })() : (
        <div className="flex items-center justify-center min-h-[200px] px-4 md:px-6 lg:px-8">
          <div className="text-gray-400 dark:text-gray-600">No fee data available</div>
        </div>
      )}
    </div>
  );
}
