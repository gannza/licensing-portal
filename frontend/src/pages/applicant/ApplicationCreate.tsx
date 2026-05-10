import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGetApplicationTypesQuery } from '../../api/applicationTypesApi';
import { useCreateApplicationMutation } from '../../api/applicationsApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getApiErrorMessage } from '../../utils/apiError';

export default function ApplicationCreate() {
  const { data: typesData, isLoading: typesLoading } = useGetApplicationTypesQuery();
  const [createApplication, { isLoading }] = useCreateApplicationMutation();
  const [selectedType, setSelectedType] = useState<string>('');
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) { toast.error('Please select an application type'); return; }
    try {
      const res = await createApplication({ application_type_id: selectedType }).unwrap();
      toast.success('Application created!');
      navigate(`/app/applications/${res.data.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create application'));
    }
  };

  if (typesLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold text-brand-base mb-2">New License Application</h2>
        <p className="text-gray-500 text-sm">Select the type of license you are applying for.</p>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        {typesData?.data?.map(type => (
          <div
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`card cursor-pointer border-2 transition-all ${
              selectedType === type.id
                ? 'border-brand-primary bg-brand-secondary/10'
                : 'border-transparent hover:border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{type.name}</h3>
                {type.description && <p className="text-sm text-gray-500 mt-1">{type.description}</p>}
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selectedType === type.id ? 'border-brand-primary bg-brand-primary' : 'border-gray-300'
              }`}>
                {selectedType === type.id && <div className="w-2 h-2 bg-brand-base rounded-full" />}
              </div>
            </div>

            {type.document_requirements && type.document_requirements.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Required Documents</p>
                <ul className="space-y-1">
                  {type.document_requirements.filter(d => d.is_required).map(doc => (
                    <li key={doc.id} className="text-xs text-gray-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary flex-shrink-0" />
                      {doc.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/app')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button type="submit" disabled={isLoading || !selectedType} className="btn-primary flex-1">
            {isLoading ? 'Creating...' : 'Create Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
