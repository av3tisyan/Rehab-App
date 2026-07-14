import { useEffect } from 'react';
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { useCreatePatient, useUpdatePatient } from '../../lib/queries';
import type { Patient } from '../../lib/types';

interface Props {
  opened: boolean;
  onClose: () => void;
  onSaved: (p: Patient) => void;
  /** When provided the modal edits this patient instead of creating a new one. */
  patient?: Patient | null;
}

interface FormValues {
  firstName: string;
  lastName: string;
  sex: string;
  dateOfBirth: string;
  phone: string;
  heightCm: number | '';
  dominantHand: string;
  referringPhysician: string;
}

const EMPTY: FormValues = {
  firstName: '',
  lastName: '',
  sex: 'unknown',
  dateOfBirth: '',
  phone: '',
  heightCm: '',
  dominantHand: '',
  referringPhysician: '',
};

function toFormValues(p: Patient): FormValues {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    sex: p.sex,
    dateOfBirth: p.dateOfBirth ?? '',
    phone: p.phone ?? '',
    heightCm: p.heightCm !== null ? Number(p.heightCm) : '',
    dominantHand: p.dominantHand ?? '',
    referringPhysician: p.referringPhysician ?? '',
  };
}

export function PatientFormModal({ opened, onClose, onSaved, patient }: Props) {
  const { t } = useTranslation();
  const create = useCreatePatient();
  const update = useUpdatePatient();
  const isEdit = !!patient;

  const form = useForm<FormValues>({
    initialValues: EMPTY,
    validate: {
      firstName: (v) => (v.trim() ? null : t('patients.firstName')),
      lastName: (v) => (v.trim() ? null : t('patients.lastName')),
    },
  });

  // Load the patient's values when opening in edit mode; reset when creating.
  useEffect(() => {
    if (opened) {
      const values = patient ? toFormValues(patient) : EMPTY;
      form.setValues(values);
      form.resetDirty(values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, patient]);

  const buildBody = (values: FormValues): Record<string, unknown> => ({
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    sex: values.sex,
    // Send explicit nulls on edit so cleared fields are unset.
    dateOfBirth: values.dateOfBirth || (isEdit ? null : undefined),
    phone: values.phone || (isEdit ? null : undefined),
    heightCm: values.heightCm !== '' ? values.heightCm : isEdit ? null : undefined,
    dominantHand: values.dominantHand || (isEdit ? null : undefined),
    referringPhysician: values.referringPhysician || (isEdit ? null : undefined),
  });

  const submit = form.onSubmit(async (values) => {
    try {
      const body = buildBody(values);
      const saved =
        isEdit && patient
          ? await update.mutateAsync({ id: patient.id, body })
          : await create.mutateAsync(body);
      notifications.show({ color: 'teal', message: `${saved.lastName} ${saved.firstName}` });
      onClose();
      onSaved(saved);
    } catch (e) {
      notifications.show({ color: 'red', message: (e as Error).message });
    }
  });

  const pending = create.isPending || update.isPending;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? t('patients.edit') : t('patients.new')}
      size="lg"
      centered
    >
      <form onSubmit={submit}>
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              size="md"
              label={t('patients.firstName')}
              withAsterisk
              {...form.getInputProps('firstName')}
            />
            <TextInput
              size="md"
              label={t('patients.lastName')}
              withAsterisk
              {...form.getInputProps('lastName')}
            />
            <Select
              size="md"
              label={t('patients.sex')}
              data={[
                { value: 'male', label: 'M' },
                { value: 'female', label: 'F' },
                { value: 'other', label: 'Other' },
                { value: 'unknown', label: '—' },
              ]}
              {...form.getInputProps('sex')}
            />
            <TextInput
              size="md"
              type="date"
              label={t('patients.dateOfBirth')}
              {...form.getInputProps('dateOfBirth')}
            />
            <TextInput size="md" label={t('patients.phone')} {...form.getInputProps('phone')} />
            <NumberInput
              size="md"
              label={t('patients.heightCm')}
              min={0}
              max={260}
              {...form.getInputProps('heightCm')}
            />
            <Select
              size="md"
              label={t('patients.dominantHand')}
              clearable
              data={[
                { value: 'right', label: t('assessment.right') },
                { value: 'left', label: t('assessment.left') },
              ]}
              {...form.getInputProps('dominantHand')}
            />
            <TextInput
              size="md"
              label={t('patients.referringPhysician')}
              {...form.getInputProps('referringPhysician')}
            />
          </SimpleGrid>

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={pending}>
              {isEdit ? t('common.save') : t('patients.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
