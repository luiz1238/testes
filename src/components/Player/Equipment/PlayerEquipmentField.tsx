import { Equipment, Skill } from '@prisma/client';
import { FormEvent, useContext, useState } from 'react';
import { Button, Form, Image } from 'react-bootstrap';
import useExtendedState from '../../../hooks/useExtendedState';
import { diceRollResultContext, toastsContext } from '../../../pages/sheet/1';
import api from '../../../utils/api';
import styles from '../../../styles/Equipment.module.scss';

type PlayerEquipmentFieldProps = {
    currentAmmo: number;
    using: boolean;
    equipment: Equipment & {
        Skill: Skill;
    };
    onDelete(id: number): void;
};

export default function PlayerEquipmentField(props: PlayerEquipmentFieldProps) {
    const [using, setUsing] = useState(props.using);
    const [lastAmmo, currentAmmo, setCurrentAmmo] = useExtendedState(props.currentAmmo);
    const [disabled, setDisabled] = useState(false);

    const addToast = useContext(toastsContext);
    const showDiceRollResult = useContext(diceRollResultContext);
    const equipmentID = props.equipment.id;

    function usingChange() {
        const _using = !using;
        setUsing(_using);
        api.post('/sheet/player/equipment', { equipmentID, using: _using }).catch(err => {
            addToast(err);
            setUsing(using);
        });
    }

    function onAmmoChange(ev: FormEvent<HTMLInputElement>) {
        const aux = ev.currentTarget.value;
        let newAmmo = parseInt(aux);

        if (aux.length === 0) newAmmo = 0;
        else if (isNaN(newAmmo)) return;

        setCurrentAmmo(newAmmo);
    }

    function onAmmoBlur() {
        if (currentAmmo === lastAmmo) return;
        setCurrentAmmo(currentAmmo);
        api.post('/sheet/player/equipment', { equipmentID, currentAmmo }).catch(err => {
            addToast(err);
            setCurrentAmmo(lastAmmo);
        });
    }

    function diceRoll() {
        if (!using) return alert('Você não está usando esse equipamento.');
        if (props.equipment.ammo && props.currentAmmo < props.equipment.ammo)
            return alert('Você não tem munição suficiente.');
        setCurrentAmmo(currentAmmo - 1);
        showDiceRollResult(props.equipment.damage);
    }

    function deleteEquipment() {
        if (!confirm('Você realmente deseja excluir esse equipamento?')) return;
        setDisabled(true);
        props.onDelete(equipmentID);
        // api.delete('/sheet/player/equipment', {
        //     data: { equipmentID }
        // }).then(() => props.onDelete(equipmentID)).catch(err => {
        //     addToast(err);
        //     setDisabled(false);
        // });
    }

    return (
        <tr>
            <td>
                <Button onClick={deleteEquipment} disabled={disabled}>
                    <Image alt='Lixo' src='/trash.svg' className={`${styles.trash} clickable`} />
                </Button>
            </td>
            <td>
                <Form.Check onChange={usingChange} checked={using} />
            </td>
            <td>{props.equipment.name}</td>
            <td>{props.equipment.Skill.name}</td>
            <td>{props.equipment.type}</td>
            <td>{props.equipment.damage}</td>
            <td><Image alt='Dado' src='/dice20.png' className={`${styles.dice} clickable`} onClick={diceRoll} /></td>
            <td>{props.equipment.range}</td>
            <td>{props.equipment.attacks}</td>
            <td>{props.equipment.ammo ?
                <input type='text' className='bottom-text text-center'
                    value={currentAmmo} onChange={onAmmoChange} onBlur={onAmmoBlur} /> :
                '-'}</td>
            <td>{props.equipment.ammo || '-'}</td>
        </tr>
    );
}