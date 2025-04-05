import { HelpCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import Joyride, { CallBackProps, Step } from 'react-joyride';
import { Button } from '@/components/ui/button';

const TourGuid = ({steps}: {steps: Step[]}) => {
	const [showTourButton, setShowTourButton] = useState(true);
	const [stepIndex, setStepIndex] = useState(0);
	const [run, setRun] = useState(false);

	useEffect(() => {
			if (stepIndex >= steps.length) {
				setRun(false);
			}
	}, [stepIndex, steps.length]);

	const handleJoyrideCallback = (data: CallBackProps) => {
		const { action, status, type } = data;
		if (type === 'step:after') {
			setStepIndex(prevIndex => prevIndex + 1);
		}
		if (type === 'step:before' && action === 'prev') {
			setStepIndex(prevIndex => prevIndex - 1);
		}

		if (['finished', 'skipped'].includes(status)) {
			setRun(false);
			setShowTourButton(true);
		}
	};

return (
	<>
	<Joyride
			steps={steps}
			continuous
			showSkipButton={true}
			showProgress
			run={run}
			stepIndex={stepIndex}
			callback={handleJoyrideCallback}
			hideCloseButton={true}
			styles={{
			options: {
					primaryColor: '#2563eb',
					zIndex: 99999,
					arrowColor: '#fff',
			},
			tooltip: {
					padding: 10,
					backgroundColor: '#fff',
			},
			spotlight: {
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
			},
			buttonNext: {
					marginRight: 10
			},
			buttonBack: {
					marginLeft: 10
			},
			overlay: {
					backgroundColor: 'rgba(0, 0, 0, 0.5)'
			}
			}}
			disableOverlayClose={false}
			spotlightPadding={10}
			floaterProps={{
			offset: 20,
			disableFlip: false
			}}
			disableScrolling={true}
			disableScrollParentFix={true}
			spotlightClicks={false}
	/>
			{showTourButton && (
				<Button 
				className="fixed right-6 bottom-6 rounded-full shadow-md hover:shadow-lg transition-shadow z-[100]"
				size="icon"
				onClick={() => {
						setRun(true);
						setStepIndex(0);
						setShowTourButton(false);
				}}
				>
					<HelpCircle className="h-5 w-5" />
				</Button>
			)}
	</>
)
}

export default TourGuid