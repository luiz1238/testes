import { FormEvent, useContext, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Image from 'react-bootstrap/Image';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Row from 'react-bootstrap/Row';
import config from '../../../../openrpg.config.json';
import { ErrorLogger, ShowDiceResult } from '../../../contexts';
import useExtendedState from '../../../hooks/useExtendedState';
import { clamp } from '../../../utils';
import api from '../../../utils/api';
import BottomTextInput from '../../BottomTextInput';
import PlayerAttributeStatusField from './PlayerAttributeStatusField';

type PlayerAttributeFieldProps = {
    playerAttribute: {
        value: number;
        maxValue: number;
        Attribute: {
            id: number;
            name: string;
            rollable: boolean;
        };
    };
    playerStatus: {
        value: boolean;
        AttributeStatus: {
            id: number;
            name: string;
            attribute_id: number;
        };
    }[];
    onStatusChange?(id: number): void;
}

export default function PlayerAttributeField({ playerAttribute, playerStatus, onStatusChange: onStatusChanged }: PlayerAttributeFieldProps) {
    const attributeID = playerAttribute.Attribute.id;
    const [value, setValue] = useState(playerAttribute.value);
    const [lastMaxValue, maxValue, setMaxValue] = useExtendedState(playerAttribute.maxValue);
    const timeout = useRef<NodeJS.Timeout>();

    const showDiceRollResult = useContext(ShowDiceResult);
    const logError = useContext(ErrorLogger);

    function updateValue(ev: React.MouseEvent, coeff: number) {
        if (ev.shiftKey) coeff *= 10;

        const newVal = clamp(value + coeff, 0, maxValue);

        if (value === newVal) return;

        setValue(newVal);

        if (timeout.current) clearTimeout(timeout.current);
        timeout.current = setTimeout(() =>
            api.post('/sheet/player/attribute', { id: attributeID, value: newVal }).catch(logError), 750);
    }

    function updateMaxValue(ev: FormEvent<HTMLInputElement>) {
        const aux = ev.currentTarget.value;
        let newMaxValue = parseInt(aux);

        if (aux.length === 0) newMaxValue = 0;
        else if (isNaN(newMaxValue)) return;

        setMaxValue(newMaxValue);
    }

    function maxValueBlur() {
        if (maxValue === lastMaxValue) return;

        setMaxValue(maxValue);
        let valueUpdated = false;
        if (value > maxValue) {
            setValue(maxValue);
            valueUpdated = true;
        };

        api.post('/sheet/player/attribute', { id: attributeID, maxValue, value: valueUpdated ? maxValue : undefined })
            .catch(err => {
                logError(err);
                setMaxValue(lastMaxValue);
            });
    }

    function diceClick() {
        const roll = config.player.attribute_bar.dice;
        const resolver = `${roll}${config.player.attribute_bar.branched ? 'b' : ''}`;
        showDiceRollResult([{ num: 1, roll: roll, ref: value }], resolver);
    }

    return (
        <>
            <Row>
                <Col><label htmlFor={`attribute${attributeID}`}>
                    Pontos de {playerAttribute.Attribute.name}
                </label></Col>
            </Row>
            <Row>
                <Col>
                    <ProgressBar now={value} min={0} max={maxValue} className={playerAttribute.Attribute.name} />
                </Col>
                {playerAttribute.Attribute.rollable &&
                    <Col xs='auto' className='align-self-center'>
                        <Image src='/dice20.png' alt='Dado' className='attribute-dice clickable' onClick={diceClick} />
                    </Col>
                }
            </Row>
            <Row className='justify-content-center mt-2'>
                <Col xs lg={3}>
                    <Button variant='secondary' className='w-100' onClick={ev => updateValue(ev, -1)}>-</Button>
                </Col>
                <Col xs lg={2} className='text-center'>
                    <label className='h5' htmlFor={`attribute${attributeID}`}>{`${value}/${maxValue}`}</label>
                </Col>
                <Col xs lg={3}>
                    <Button variant='secondary' className='w-100' onClick={ev => updateValue(ev, 1)}>+</Button>
                </Col>
            </Row>
            <Row>
                <Col xs={{ span: 4, offset: 4 }} lg={{ span: 2, offset: 5 }} className='h5' >
                    <BottomTextInput maxLength={3} autoComplete='off' value={maxValue}
                        onChange={updateMaxValue} id={`attribute${attributeID}`}
                        className='text-center w-100' onBlur={maxValueBlur} />
                </Col>
            </Row>
            <Row className='mb-3'>
                <Col>
                    {playerStatus.map(stat =>
                        <PlayerAttributeStatusField key={stat.AttributeStatus.id}
                            playerAttributeStatus={stat} onStatusChanged={onStatusChanged} />
                    )}
                </Col>
            </Row>
        </>
    );
}