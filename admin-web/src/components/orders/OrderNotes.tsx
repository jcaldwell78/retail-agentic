import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, User, Clock, Trash2, Edit, Check, X } from 'lucide-react';

export interface OrderNote {
  id: string;
  author: string;
  authorRole: 'admin' | 'staff' | 'system';
  content: string;
  timestamp: Date;
  isInternal: boolean; // If true, not visible to customer
  isEdited?: boolean;
  editedAt?: Date;
}

interface OrderNotesProps {
  orderId: string;
  initialNotes?: OrderNote[];
  currentUserName?: string;
  currentUserRole?: 'admin' | 'staff';
  onAddNote?: (note: Omit<OrderNote, 'id' | 'timestamp'>) => void;
  onEditNote?: (noteId: string, content: string) => void;
  onDeleteNote?: (noteId: string) => void;
}

export default function OrderNotes({
  orderId,
  initialNotes = [],
  currentUserName = 'Admin User',
  currentUserRole = 'admin',
  onAddNote,
  onEditNote,
  onDeleteNote,
}: OrderNotesProps) {
  const [notes, setNotes] = useState<OrderNote[]>(initialNotes.length > 0 ? initialNotes : [
    {
      id: '1',
      author: 'System',
      authorRole: 'system',
      content: 'Order created and payment confirmed.',
      timestamp: new Date(Date.now() - 86400000),
      isInternal: false,
    },
    {
      id: '2',
      author: 'John Admin',
      authorRole: 'admin',
      content: 'Customer requested expedited shipping. Updated shipping method.',
      timestamp: new Date(Date.now() - 43200000),
      isInternal: true,
    },
    {
      id: '3',
      author: 'System',
      authorRole: 'system',
      content: 'Order status updated to Processing.',
      timestamp: new Date(Date.now() - 21600000),
      isInternal: false,
    },
  ]);

  const [newNote, setNewNote] = useState('');
  const [isInternal, setIsInternal] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showInternalOnly, setShowInternalOnly] = useState(false);

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const note: OrderNote = {
      id: `note-${Date.now()}`,
      author: currentUserName,
      authorRole: currentUserRole,
      content: newNote.trim(),
      timestamp: new Date(),
      isInternal,
    };

    setNotes([...notes, note]);
    onAddNote?.(note);
    setNewNote('');
  };

  const handleStartEdit = (note: OrderNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = (noteId: string) => {
    if (!editContent.trim()) return;

    setNotes(notes.map(note =>
      note.id === noteId
        ? { ...note, content: editContent.trim(), isEdited: true, editedAt: new Date() }
        : note
    ));
    onEditNote?.(noteId, editContent.trim());
    setEditingNoteId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  const handleDeleteNote = (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    setNotes(notes.filter(note => note.id !== noteId));
    onDeleteNote?.(noteId);
  };

  const formatTimestamp = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAuthorColor = (role: OrderNote['authorRole']) => {
    switch (role) {
      case 'admin':
        return 'text-purple-600';
      case 'staff':
        return 'text-blue-600';
      case 'system':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredNotes = showInternalOnly
    ? notes.filter(note => note.isInternal)
    : notes;

  return (
    <div className="space-y-4" data-testid="order-notes">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Order Notes & Comments</h2>
          <span className="text-sm text-gray-600">({notes.length} notes)</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showInternalOnly}
              onChange={(e) => setShowInternalOnly(e.target.checked)}
              className="rounded"
              data-testid="filter-internal"
            />
            Show internal only
          </label>
        </div>
      </div>

      {/* Add New Note */}
      <Card className="p-4">
        <div className="space-y-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note or comment about this order..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            data-testid="new-note-input"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded"
                data-testid="internal-note-checkbox"
              />
              <span className="text-gray-700">
                Internal note (not visible to customer)
              </span>
            </label>
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              size="sm"
              data-testid="add-note-btn"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </div>
        </div>
      </Card>

      {/* Notes List */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {showInternalOnly ? 'No internal notes yet' : 'No notes yet'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Add a note to track important information about this order
            </p>
          </Card>
        ) : (
          filteredNotes.map((note) => (
            <Card
              key={note.id}
              className={`p-4 ${note.isInternal ? 'bg-yellow-50 border-yellow-200' : ''}`}
              data-testid={`note-${note.id}`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 ${
                  note.authorRole === 'system' ? 'bg-blue-100' : ''
                }`}>
                  <User className={`w-4 h-4 ${getAuthorColor(note.authorRole)}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Author and Timestamp */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium ${getAuthorColor(note.authorRole)}`}>
                      {note.author}
                    </span>
                    {note.authorRole !== 'system' && (
                      <span className="text-xs text-gray-500 uppercase">
                        {note.authorRole}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(note.timestamp)}
                    </span>
                    {note.isInternal && (
                      <>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">
                          Internal
                        </span>
                      </>
                    )}
                    {note.isEdited && (
                      <>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500 italic">edited</span>
                      </>
                    )}
                  </div>

                  {/* Note Content */}
                  {editingNoteId === note.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                        rows={3}
                        data-testid="edit-note-input"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(note.id)}
                          disabled={!editContent.trim()}
                          data-testid="save-edit-btn"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  )}
                </div>

                {/* Actions */}
                {note.authorRole !== 'system' && editingNoteId !== note.id && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEdit(note)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Edit note"
                      data-testid={`edit-note-${note.id}`}
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 hover:bg-red-50 rounded"
                      title="Delete note"
                      data-testid={`delete-note-${note.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Note Count Summary */}
      <div className="text-sm text-gray-600 flex gap-4">
        <span>
          Total: {notes.length} notes
        </span>
        <span>
          Internal: {notes.filter(n => n.isInternal).length}
        </span>
        <span>
          Public: {notes.filter(n => !n.isInternal).length}
        </span>
      </div>
    </div>
  );
}
