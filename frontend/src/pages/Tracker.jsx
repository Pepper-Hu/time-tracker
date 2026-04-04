import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

// Tracker page with one global timer per user and time entry CRUD operations.
// Entry lifecycle: start -> stop (auto-save) -> optional description update -> delete.
const Tracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [runningEntryId, setRunningEntryId] = useState(null);
  const [tick, setTick] = useState(Date.now());
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editDescription, setEditDescription] = useState('');

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
      const running = response.data.find((entry) => !entry.endTime);
      setRunningEntryId(running ? running._id : null);
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
    if (!runningEntryId) return undefined;
    const intervalId = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [runningEntryId]);

  const runningEntry = entries.find((entry) => entry._id === runningEntryId);

  // Starts a new entry with current time if no timer is already running.
  const handleStart = async () => {
    if (!user?.token || runningEntryId || saving) return;
    setSaving(true);
    try {
      await axiosInstance.post(
        '/api/timeentries/start',
        {},
        { headers: authHeaders },
      );
      await fetchEntries();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        'Failed to start timer. Please retry.';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  // Stops the current running entry and lets backend compute final duration.
  const handleStop = async () => {
    if (!user?.token || !runningEntryId || saving) return;
    setSaving(true);
    try {
      await axiosInstance.put(
        `/api/timeentries/${runningEntryId}/stop`,
        {},
        { headers: authHeaders },
      );
      await fetchEntries();
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Failed to stop timer. Please retry.';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  // Opens inline edit mode for an entry description.
  const beginEdit = (entry) => {
    setEditId(entry._id);
    setEditDescription(entry.description || '');
  };

  // Persists an updated description for the selected entry.
  const saveDescription = async (entryId) => {
    if (!user?.token || saving) return;
    setSaving(true);
    try {
      await axiosInstance.put(
        `/api/timeentries/${entryId}`,
        { description: editDescription },
        { headers: authHeaders },
      );
      setEditId(null);
      setEditDescription('');
      await fetchEntries();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        'Failed to update description. Please retry.';
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
        setEditDescription('');
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
        <h1 className='text-2xl font-bold mb-2'>Global Timer</h1>
        <p className='text-gray-600 mb-4'>
          Only one timer can run at a time for each user.
        </p>
        <p className='text-4xl font-mono mb-4'>
          {formatDuration(calculateLiveSeconds(runningEntry))}
        </p>
        <div className='flex gap-3'>
          <button
            type='button'
            onClick={handleStart}
            disabled={Boolean(runningEntryId) || saving}
            className='bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400'
          >
            Start
          </button>
          <button
            type='button'
            onClick={handleStop}
            disabled={!runningEntryId || saving}
            className='bg-red-600 text-white px-4 py-2 rounded disabled:bg-gray-400'
          >
            Stop
          </button>
        </div>
      </section>

      <section className='bg-white p-6 shadow-md rounded'>
        <h2 className='text-2xl font-bold mb-4'>Time Entries</h2>
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
                  {entry.createBy}
                </p>

                <div className='mt-2'>
                  <p className='font-semibold'>Description:</p>
                  {editId === entry._id ? (
                    <>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className='w-full border rounded p-2 mt-1'
                        rows={3}
                      />
                      <div className='flex gap-2 mt-2'>
                        <button
                          type='button'
                          onClick={() => saveDescription(entry._id)}
                          className='bg-blue-600 text-white px-3 py-1 rounded'
                          disabled={saving}
                        >
                          Save
                        </button>
                        <button
                          type='button'
                          onClick={() => {
                            setEditId(null);
                            setEditDescription('');
                          }}
                          className='bg-gray-500 text-white px-3 py-1 rounded'
                          disabled={saving}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className='text-gray-700 mt-1'>
                      {entry.description ? entry.description : 'No description'}
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
