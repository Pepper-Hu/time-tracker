import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

// Tracker page with one global timer per user and time entry CRUD operations.
// Entry lifecycle: start -> stop (auto-save) -> optional description update -> delete.
const RUNNING_TIMER_STORAGE_KEY = 'timeTrackerRunningStartTime';

const Tracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [runningEntryId, setRunningEntryId] = useState(null);
  const [runningStartTime, setRunningStartTime] = useState(() => {
    try {
      return localStorage.getItem(RUNNING_TIMER_STORAGE_KEY);
    } catch (error) {
      return null;
    }
  });
  const [tick, setTick] = useState(Date.now());
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    description: '',
  });

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${user?.token || ''}` }),
    [user],
  );

  // Formats seconds as HH:MM:SS for timer and entry display.
  const formatDuration = (secondsValue) => {
    const totalSeconds = Math.max(0, Number(secondsValue || 0));
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      '0',
    );
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Returns live elapsed seconds for running entries, or saved duration for stopped ones.
  const calculateLiveSeconds = (entry) => {
    if (!entry) return 0;
    if (entry.endTime) return Number(entry.duration || 0);
    const diffMs = tick - new Date(entry.startTime).getTime();
    return Math.max(0, Math.floor(diffMs / 1000));
  };

  // Loads all entries and derives whether a timer is currently running.
  const fetchEntries = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await axiosInstance.get('/api/timeentries', {
        headers: authHeaders,
      });
      setEntries(response.data);

      // Compatibility: if an old server-side running entry exists, keep tracking it.
      const running = response.data.find((entry) => !entry.endTime);
      if (running) {
        setRunningEntryId(running._id);
        setRunningStartTime(running.startTime);
        localStorage.setItem(RUNNING_TIMER_STORAGE_KEY, running.startTime);
      } else {
        setRunningEntryId(null);
      }
    } catch (error) {
      alert('Failed to load time entries.');
    }
  }, [authHeaders, user?.token]);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Ticks once per second to update live timer text while running.
  useEffect(() => {
    if (!runningStartTime) return undefined;
    const intervalId = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [runningStartTime]);

  const runningEntry = runningEntryId
    ? entries.find((entry) => entry._id === runningEntryId)
    : null;

  // Calculates live timer seconds from local running start time.
  const calculateRunningSeconds = () => {
    if (!runningStartTime) return 0;
    const diffMs = tick - new Date(runningStartTime).getTime();
    return Math.max(0, Math.floor(diffMs / 1000));
  };

  // Converts ISO date string to YYYY-MM-DD for <input type='date'>.
  const toDateInputValue = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Converts ISO date string to YYYY-MM-DDTHH:mm for <input type='datetime-local'>.
  const toDateTimeLocalValue = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Starts a local running timer; DB entry is created only when timer stops.
  const handleStart = async () => {
    if (!user?.token || runningStartTime || saving) return;
    const now = new Date().toISOString();
    setRunningStartTime(now);
    setRunningEntryId(null);
    localStorage.setItem(RUNNING_TIMER_STORAGE_KEY, now);
  };

  // Stops timer and persists entry on stop, matching the requested workflow.
  const handleStop = async () => {
    if (!user?.token || !runningStartTime || saving) return;
    setSaving(true);
    try {
      if (runningEntryId) {
        // Backward compatibility for older running entries created at start.
        await axiosInstance.put(
          `/api/timeentries/${runningEntryId}/stop`,
          {},
          { headers: authHeaders },
        );
      } else {
        const stoppedAt = new Date().toISOString();
        const created = await axiosInstance.post(
          '/api/timeentries/start',
          {},
          { headers: authHeaders },
        );

        await axiosInstance.put(
          `/api/timeentries/${created.data._id}`,
          {
            startTime: runningStartTime,
            endTime: stoppedAt,
            date: runningStartTime,
            description: '',
          },
          { headers: authHeaders },
        );
      }

      setRunningStartTime(null);
      setRunningEntryId(null);
      localStorage.removeItem(RUNNING_TIMER_STORAGE_KEY);
      await fetchEntries();
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Failed to stop timer. Please retry.';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  // Opens inline edit mode with full editable entry fields.
  const beginEdit = (entry) => {
    setEditId(entry._id);
    setEditForm({
      date: toDateInputValue(entry.date),
      startTime: toDateTimeLocalValue(entry.startTime),
      endTime: toDateTimeLocalValue(entry.endTime),
      description: entry.description || '',
    });
  };

  // Persists date, time, and description updates for the selected entry.
  const saveEntry = async (entryId) => {
    if (!user?.token || saving) return;

    if (editForm.startTime && editForm.endTime) {
      const start = new Date(editForm.startTime).getTime();
      const end = new Date(editForm.endTime).getTime();
      if (end <= start) {
        alert('End time must be later than start time.');
        return;
      }
    }

    const payload = {
      description: editForm.description,
    };

    if (editForm.date) {
      payload.date = new Date(`${editForm.date}T00:00:00`).toISOString();
    }
    if (editForm.startTime) {
      payload.startTime = new Date(editForm.startTime).toISOString();
    }
    if (editForm.endTime) {
      payload.endTime = new Date(editForm.endTime).toISOString();
    }

    setSaving(true);
    try {
      await axiosInstance.put(`/api/timeentries/${entryId}`, payload, {
        headers: authHeaders,
      });
      setEditId(null);
      setEditForm({ date: '', startTime: '', endTime: '', description: '' });
      await fetchEntries();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        'Failed to update entry. Please retry.';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  // Removes an entry and resets edit state when deleting the edited item.
  const deleteEntry = async (entryId) => {
    if (!user?.token || saving) return;
    setSaving(true);
    try {
      await axiosInstance.delete(`/api/timeentries/${entryId}`, {
        headers: authHeaders,
      });
      if (entryId === editId) {
        setEditId(null);
        setEditForm({ date: '', startTime: '', endTime: '', description: '' });
      }
      await fetchEntries();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        'Failed to delete entry. Please retry.';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='container mx-auto p-6'>
      <section className='bg-white p-6 shadow-md rounded mb-6'>
        <h1 className='text-2xl font-bold mb-2'>Timer</h1>
        <p className='text-gray-600 mb-4'>
          Start the timer when you begin working and stop it when you're done.
          You can add a description to each entry and manage them below.
        </p>
        <p className='text-4xl font-mono mb-4'>
          {formatDuration(
            runningEntry
              ? calculateLiveSeconds(runningEntry)
              : calculateRunningSeconds(),
          )}
        </p>
        <div className='flex gap-3'>
          <button
            type='button'
            onClick={handleStart}
            disabled={Boolean(runningStartTime) || saving}
            className='bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400'
          >
            Start
          </button>
          <button
            type='button'
            onClick={handleStop}
            disabled={!runningStartTime || saving}
            className='bg-red-600 text-white px-4 py-2 rounded disabled:bg-gray-400'
          >
            Stop
          </button>
        </div>
      </section>

      <section className='bg-white p-6 shadow-md rounded'>
        <h2 className='text-2xl font-bold mb-4'>Past Time Entries</h2>
        {entries.length === 0 ? (
          <p className='text-gray-600'>
            No entries yet. Start and stop the timer.
          </p>
        ) : (
          <div className='space-y-4'>
            {entries.map((entry) => (
              <article key={entry._id} className='border rounded p-4'>
                <p>
                  <span className='font-semibold'>Date:</span>{' '}
                  {new Date(entry.date).toLocaleDateString()}
                </p>
                <p>
                  <span className='font-semibold'>Start:</span>{' '}
                  {new Date(entry.startTime).toLocaleString()}
                </p>
                <p>
                  <span className='font-semibold'>End:</span>{' '}
                  {entry.endTime
                    ? new Date(entry.endTime).toLocaleString()
                    : 'Running'}
                </p>
                <p>
                  <span className='font-semibold'>Duration:</span>{' '}
                  {formatDuration(calculateLiveSeconds(entry))}
                </p>
                <p className='break-all'>
                  <span className='font-semibold'>Created By:</span>{' '}
                  {typeof entry.createBy === 'object' && entry.createBy?.name
                    ? entry.createBy.name
                    : user?.name || 'Current user'}
                </p>

                <div className='mt-2'>
                  <p className='font-semibold'>Description:</p>
                  {editId === entry._id ? (
                    <>
                      <label className='block mt-2 text-sm font-medium'>
                        Date
                      </label>
                      <input
                        type='date'
                        value={editForm.date}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                        className='w-full border rounded p-2 mt-1'
                      />

                      <label className='block mt-2 text-sm font-medium'>
                        Start Time
                      </label>
                      <input
                        type='datetime-local'
                        value={editForm.startTime}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
                        }
                        className='w-full border rounded p-2 mt-1'
                      />

                      <label className='block mt-2 text-sm font-medium'>
                        End Time
                      </label>
                      <input
                        type='datetime-local'
                        value={editForm.endTime}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            endTime: e.target.value,
                          }))
                        }
                        className='w-full border rounded p-2 mt-1'
                      />

                      <label className='block mt-2 text-sm font-medium'>
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className='w-full border rounded p-2 mt-1'
                        rows={3}
                      />
                      <div className='flex gap-2 mt-2'>
                        <button
                          type='button'
                          onClick={() => saveEntry(entry._id)}
                          className='bg-blue-600 text-white px-3 py-1 rounded'
                          disabled={saving}
                        >
                          Save
                        </button>
                        <button
                          type='button'
                          onClick={() => {
                            setEditId(null);
                            setEditForm({
                              date: '',
                              startTime: '',
                              endTime: '',
                              description: '',
                            });
                          }}
                          className='bg-gray-500 text-white px-3 py-1 rounded'
                          disabled={saving}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className='mt-1'>
                      {entry.description ? (
                        <span className='text-gray-700'>
                          {entry.description}
                        </span>
                      ) : (
                        <span className='text-amber-700'>
                          No description yet. Click Edit to add one.
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {editId !== entry._id && (
                  <div className='flex gap-2 mt-3'>
                    <button
                      type='button'
                      onClick={() => beginEdit(entry)}
                      className='bg-yellow-500 text-white px-3 py-1 rounded'
                      disabled={saving}
                    >
                      Edit
                    </button>
                    <button
                      type='button'
                      onClick={() => deleteEntry(entry._id)}
                      className='bg-red-500 text-white px-3 py-1 rounded'
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Tracker;
