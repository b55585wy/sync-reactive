import { useTrainingStore } from '@/stores/training';

const trainingStore = useTrainingStore();

// 在开始训练时
onMounted(() => {
  trainingStore.startTraining();
});

// 在收到心率数据时
const onHeartRateUpdate = (heartRate: number) => {
  trainingStore.addHeartRateRecord(heartRate);
};

// 在训练结束时
const endTraining = async () => {
  trainingStore.endTraining();
  await router.push({
    name: 'Summary',
    query: {
      duration: props.duration.toString(),
      mode: props.mode
    }
  });
}; 